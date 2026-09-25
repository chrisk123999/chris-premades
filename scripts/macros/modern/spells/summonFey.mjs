import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
const creatureTypes = {
    'summon-fey-fuming': 'fuming',
    'summon-fey-mirthful': 'mirthful',
    'summon-fey-tricksy': 'tricksy'
};
const translations = 'CHRISPREMADES.Macros.Modern.SummonFey.';
async function getFeature(identifier, {translate, flatAttack, flatDC} = {}) {
    return await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.monsterFeatures, identifier, {object: true, translate, flatAttack, flatDC});
}
async function getMoodFeature(document, creatureType) {
    const feature = await getFeature('summon-fey-' + creatureType, {
        translate: translations + creatureType.capitalize(),
        flatDC: creatureType === 'mirthful' ? itemUtils.getSaveDC(document) : undefined
    });
    if (feature && creatureType === 'tricksy') genericUtils.setProperty(feature, 'flags.cat.config', {
        ...automationUtils.getConfigValues(document, ['useRealDarkness', 'darknessAnimation']),
        spreadAroundCorners: true,
        animation: {source: 'chris-premades', identifier: 'darknessSphere'}
    });
    return feature;
}
function getDuration(workflow) {
    const activity = workflow.item.system.linkedActivity;
    return documentUtils.getIdentifier(activity?.item) === 'fey-reinforcements' ? 60 : 3600;
}
async function use({document, workflow}) {
    const creatureType = creatureTypes[workflow.activity.identifier];
    if (!creatureType) return;
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const sourceActor = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.summons, 'feySpirit');
    if (!sourceActor) {
        genericUtils.notify('CHRISPREMADES.Error.ActorNotFound', {type: 'warn'});
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const spellLevel = workflowUtils.getCastLevel(workflow);
    const items = await Promise.all([
        getFeature('summon-fey-multiattack', {translate: _loc(translations + 'Multiattack', {numAttacks: Math.floor(spellLevel / 2)})}),
        getFeature('summon-fey-fey-blade', {translate: translations + 'FeyBlade', flatAttack: itemUtils.getSpellAttackBonus(document)}),
        getFeature('summon-fey-fey-step', {translate: translations + 'FeyStep'}),
        getMoodFeature(document, creatureType)
    ]);
    if (items[1]) itemUtils.addDamageBonus(items[1], spellLevel);
    if (items.some(item => !item)) {
        genericUtils.notify('CHRISPREMADES.Error.MissingPackItem', {type: 'warn'});
        if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
        return;
    }
    const hp = automationUtils.getConfigValue(document, 'baseHitPoints') + ((spellLevel - 3) * 10);
    const updates = {
        system: {
            details: {cr: actorUtils.getCR(workflow.actor)},
            attributes: {
                ac: {flat: 12 + spellLevel},
                hp: {formula: String(hp), max: hp, value: hp}
            }
        }
    };
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        items,
        updates,
        name: automationUtils.getConfigValue(document, creatureType + 'Name') || _loc('CHRISPREMADES.Summons.CreatureNames.FeySpirit' + creatureType.capitalize()),
        tokenImg: automationUtils.getConfigValue(document, creatureType + 'Token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, creatureType + 'Avatar') || undefined,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        duration: getDuration(workflow),
        initiative: 'follows',
        parent: concentrationEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function feyStep({document, workflow}) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    await tokenUtils.teleportToken(workflow.token.document, {range: workflow.activity.range.value, animation, options});
    const moodItem = actorUtils.getItemByIdentifiers(workflow.actor, Object.keys(creatureTypes));
    if (!moodItem) return;
    const identifier = documentUtils.getIdentifier(moodItem);
    if (identifier === 'summon-fey-fuming') return await workflowUtils.completeItemUse(moodItem);
    if (identifier === 'summon-fey-tricksy') return await workflowUtils.syntheticItemRoll(moodItem);
    const nearby = tokenUtils.findNearby(workflow.token.document, 10, {disposition: 'enemy'});
    if (!nearby.length) return;
    const selection = await dialogUtils.selectTargetDialog(document.name + ': ' + moodItem.name, translations + 'Select', nearby);
    if (!selection?.result) return;
    await workflowUtils.syntheticItemRoll(moodItem, [selection.result]);
}
const summonConfig = creatureType => ({
    [creatureType + 'Name']: {default: '', type: 'text', label: 'CHRISPREMADES.Config.CustomName', category: 'summons'},
    [creatureType + 'Token']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomToken', category: 'summons'},
    [creatureType + 'Avatar']: {default: '', type: 'file', label: 'CHRISPREMADES.Config.CustomAvatar', category: 'summons'},
    [creatureType + 'Animation']: {default: {source: 'chris-premades', identifier: 'natureSummon'}, type: 'selectAnimation', inputs: ['summon', 'location', 'token'], label: 'CHRISPREMADES.Config.Animation', category: 'animations'}
});
export const summonFey = {
    name: 'Summon Fey',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        baseHitPoints: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.HitPoints',
            category: 'homebrew'
        },
        range: {
            default: 90,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        ...summonConfig('fuming'),
        ...summonConfig('mirthful'),
        ...summonConfig('tricksy'),
        useRealDarkness: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.RealDarkness',
            category: 'mechanics'
        },
        darknessAnimation: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Config.DarknessAnimation',
            category: 'mechanics',
            get options() {
                return [{value: '', label: _loc('DND5E.None')}, ...Object.entries(CONFIG.Canvas.darknessAnimations).map(([value, config]) => ({value, label: config.label}))];
            }
        }
    }
};
export const summonFeyFeyStep = {
    name: 'Summon Fey: Fey Step',
    version: summonFey.version,
    rules: summonFey.rules,
    roll: [
        {pass: 'itemRollFinished', macro: feyStep, priority: 50}
    ],
    config: {
        animation: {
            default: {source: 'chris-premades', identifier: 'mistyStep'},
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
