import {actorUtils, animationUtils, automationUtils, dialogUtils, genericUtils, Logging, queryUtils, summonUtils, tokenUtils} from '../../../proxy.mjs';
import {getDamageType} from '../../generic/spellAnimation.mjs';
const databasePath = 'jb2a.spiritual_weapon';
const attackActivity = 'spiritual-weapon-attack';
function getWeaponTokens(document) {
    return summonUtils.getSummonsBySource(document).map(summon => summon.token).filter(Boolean);
}
function getLabel(prefix, value) {
    const key = prefix + value.capitalize();
    return game.i18n.has(key) ? key : value.capitalize();
}
function getWeaponEntries() {
    const paths = Sequencer.Database.getPathsUnder(databasePath, {fullyQualified: true});
    return paths.filter(path => !paths.some(other => other.startsWith(path + '.'))).map(path => {
        const [weapon, style, color = ''] = path.slice(databasePath.length + 1).split('.').filter(part => !/^\d+$/.test(part));
        return {path, weapon, style, color};
    });
}
async function pickOption(title, content, values, prefix, userId) {
    const options = [...new Set(values)];
    if (options.length < 2) return options[0];
    return await dialogUtils.buttonDialog(title, content, options.map(value => [getLabel(prefix, value), value]), {userId, displayAsRows: options.length < 8, sort: 'alphabetical'});
}
async function pickWeapon(document, userId) {
    let entries = getWeaponEntries();
    const style = await pickOption(document.name, 'CHRISPREMADES.Macros.All.SpiritualWeapon.Style', entries.map(entry => entry.style), 'CHRISPREMADES.Macros.All.SpiritualWeapon.Styles.', userId);
    if (!style) return;
    entries = entries.filter(entry => entry.style === style);
    const weapon = await pickOption(document.name, 'CHRISPREMADES.Macros.All.SpiritualWeapon.Weapon', entries.map(entry => entry.weapon), 'CHRISPREMADES.Macros.All.SpiritualWeapon.Weapons.', userId);
    if (!weapon) return;
    entries = entries.filter(entry => entry.weapon === weapon);
    const color = await pickOption(document.name, 'CHRISPREMADES.Macros.All.SpiritualWeapon.Color', entries.map(entry => entry.color), 'CHRISPREMADES.Config.Colors.', userId);
    if (color === undefined || color === false) return;
    const path = entries.find(entry => entry.color === color)?.path;
    if (!path) return;
    if (await dialogUtils.confirm(document.name, _loc('CAT.Dialog.Remember.Permanent'), {userId})) await automationUtils.setConfigValue(document, 'savedTokenImg', path);
    return path;
}
function resolveFile(path) {
    if (!Sequencer.Database.entryExists(path)) return path;
    return Sequencer.Database.getEntry(path)?.file;
}
async function preCreate({document, summon, updates}) {
    const summonData = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summons')?.find(data => data.sourceActorUuid === summon.sourceActorUuid);
    if (summonData?.tokenImg || !animationUtils.jb2aCheck() || !animationUtils.sequencerCheck()) return;
    const path = automationUtils.getConfigValue(document, 'savedTokenImg') || await pickWeapon(document, queryUtils.firstOwner(document.actor, true));
    if (!path) return;
    const file = resolveFile(path);
    if (!file) return Logging.addMacroWarning('CPR', 'spiritual-weapon', 'CHRISPREMADES.Macros.All.SpiritualWeapon.MissingFile', {notify: 'warn'});
    genericUtils.setProperty(updates, 'prototypeToken.texture.src', file);
}
function early({document, activity, config, dialog}) {
    if (activity.identifier !== attackActivity) return;
    const summonActor = summonUtils.getSummonsBySource(document).find(summon => summon.actor)?.actor;
    const castLevel = summonActor ? actorUtils.getSavedCastData(summonActor)?.castLevel : undefined;
    if (!castLevel) return;
    config.spell = {...config.spell, slot: 'spell' + castLevel};
    dialog.configure = false;
}
function validate({document, workflow}) {
    if (workflow.activity.identifier !== attackActivity) return;
    const targetToken = workflow.targets.first();
    if (!targetToken) return;
    const reach = automationUtils.getConfigValue(document, 'reach');
    if (getWeaponTokens(document).some(token => tokenUtils.getDistance(token, targetToken.document) <= reach)) return;
    Logging.addMacroWarning('CPR', 'spiritual-weapon', 'CHRISPREMADES.Macros.All.SpiritualWeapon.OutOfReach', {notify: 'info'});
    return true;
}
async function late({document, workflow}) {
    if (workflow.activity.identifier !== attackActivity) return;
    const targetToken = workflow.targets.first();
    if (!targetToken) return;
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!animation?.macros?.play) return;
    const [weaponToken] = getWeaponTokens(document).sort((a, b) => tokenUtils.getDistance(a, targetToken.document) - tokenUtils.getDistance(b, targetToken.document));
    if (!weaponToken) return;
    await animation.macros.play(weaponToken, targetToken.document, {...options, damageType: getDamageType(workflow), hit: workflow.hitTargets.has(targetToken)});
}
export const spiritualWeapon = {
    name: 'Spiritual Weapon',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemPreambleComplete',
            macro: validate,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'preCreate',
            macro: preCreate,
            priority: 50
        }
    ],
    config: {
        savedTokenImg: {
            default: '',
            type: 'file',
            sequencer: true,
            fileType: 'imagevideo',
            label: 'CHRISPREMADES.Macros.All.SpiritualWeapon.SavedTokenImg',
            hint: 'CHRISPREMADES.Macros.All.SpiritualWeapon.SavedTokenImgHint',
            category: 'animations'
        },
        reach: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.SpiritualWeapon.Reach',
            hint: 'CHRISPREMADES.Macros.All.SpiritualWeapon.ReachHint',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'spiritualWeapon'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
