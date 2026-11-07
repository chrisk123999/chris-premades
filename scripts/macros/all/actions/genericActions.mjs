import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, compendiumUtils, dialogUtils, documentUtils, genericUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
import {influence} from '../../modern/actions/influence.mjs';
import {holdBreathLegacy, holdBreathModern} from './holdBreath.mjs';
import {knockOut} from './knockOut.mjs';
import {readyItem} from './readySpell.mjs';
import {underwaterLegacy, underwaterModern} from './underwater.mjs';
const ruleKeys = {
    'check-cover': 'cover',
    fall: 'falling',
    grapple: 'grappling',
    jump: 'jumping',
    'knock-out': 'knockingacreatureout',
    shove: 'shoving',
    squeeze: 'squeezing',
    stabilize: 'stabilizing',
    'hold-breath': 'suffocating',
    underwater: 'underwatercombat'
};
function getActionsIndex(rules) {
    const pack = game.packs.get(rules === 'legacy' ? cprConstants.packs.legacy.misc : cprConstants.packs.modern.misc);
    const folder = pack?.folders.getName('Actions');
    return folder ? pack.index.filter(entry => entry.folder === folder.id) : [];
}
function getActions(rules) {
    const healingSurge = game.settings.get('chris-premades', 'healingSurge');
    return getActionsIndex(rules).filter(entry => healingSurge || entry.system.identifier !== 'healing-surge');
}
function getItemRules(item) {
    return documentUtils.getRules(item) === '2014' ? 'legacy' : 'modern';
}
async function use({document: item, workflow}) {
    if (workflow.activity?.midiProperties?.identifier === 'release') return;
    const offered = automationUtils.getConfigValue(item, 'actions');
    const actions = getActions(getItemRules(item)).filter(entry => !offered?.length || offered.includes(entry.system.identifier)).map(entry => {
        const reference = CONFIG.DND5E.rules[ruleKeys[entry.system.identifier] ?? entry.system.identifier.replaceAll('-', '')];
        return reference ? {...entry, reference} : entry;
    });
    if (!actions.length) return;
    const selection = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.All.GenericActions.Select', actions, {sort: 'alphabetical', displayReference: true});
    if (!selection) return;
    const isHealingSurge = documentUtils.getIdentifier(selection) === 'healing-surge';
    if (isHealingSurge) {
        const ownItem = actorUtils.getItemByIdentifier(workflow.actor, 'healing-surge');
        if (ownItem ? !ownItem.system.uses.value : item.flags['chris-premades']?.healingSurgeUsed) {
            genericUtils.notify('CHRISPREMADES.Macros.All.GenericActions.HealingSurgeUsed', {type: 'warn'});
            return;
        }
        if (ownItem) {
            await workflowUtils.syntheticItemRoll(ownItem, [], {userId: game.user.id});
            return;
        }
    }
    const itemData = selection.toObject();
    const config = {...itemData.flags.cat?.config, ...item.flags.cat?.config};
    genericUtils.setProperty(itemData, 'flags.cat.config', config);
    const hideDC = automationUtils.getConfigValue(item, 'hideDC');
    if (hideDC !== undefined) Object.values(itemData.system.activities).forEach(activity => {
        const hide = activity.flags?.cat?.genericConfig?.['chris-premades']?.hide;
        if (hide) hide.dc = hideDC;
    });
    itemData.effects.forEach(effect => genericUtils.setProperty(effect, 'flags.cat.config', {...effect.flags?.cat?.config, ...item.flags.cat?.config}));
    Object.values(itemData.system.activities).forEach(activity => activity.consumption.targets = activity.consumption.targets.filter(target => target.type !== 'itemUses' || target.target));
    const actionWorkflow = await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [], {consumeUsage: false, userId: game.user.id});
    if (isHealingSurge && actionWorkflow) await documentUtils.setFlag(item, 'chris-premades', 'healingSurgeUsed', true);
}
async function rest({document: item}) {
    if (item.flags['chris-premades']?.healingSurgeUsed) await documentUtils.setFlag(item, 'chris-premades', 'healingSurgeUsed', false);
}
function getActionUuid(itemId) {
    return ['legacy', 'modern'].flatMap(getActionsIndex).find(entry => entry._id === itemId)?.uuid;
}
function toCompendiumUuid(uuid) {
    const match = /^(.+?\.Item\.([^.]+))(.*)$/.exec(uuid ?? '');
    if (!match || match[1].startsWith('Compendium.') || fromUuidSync(match[1], {strict: false})) return;
    const compendiumUuid = getActionUuid(match[2]);
    if (compendiumUuid) return compendiumUuid + match[3];
}
async function createActiveEffect(effect, _options, userId) {
    if (userId !== game.user.id) return;
    const updates = {};
    const origin = toCompendiumUuid(effect.origin);
    if (origin) updates.origin = origin;
    for (const key of ['activity', 'effect', 'item']) {
        const uuid = toCompendiumUuid(effect.system?.origin?.[key]);
        if (uuid) updates['system.origin.' + key] = uuid;
    }
    if (Object.keys(updates).length) await documentUtils.update(effect, updates);
}
const pendingActors = new Map();
function createToken(token, _options, userId) {
    if (userId !== game.user.id || !token.actor) return;
    const key = token.actor.uuid;
    const next = (pendingActors.get(key) ?? Promise.resolve()).then(() => addActions(token));
    pendingActors.set(key, next);
    next.finally(() => {
        if (pendingActors.get(key) === next) pendingActors.delete(key);
    });
}
function includeActor(mode, actor, token) {
    switch (mode) {
        case 'all': return true;
        case 'character': return actor.type === 'character';
        case 'linked': return token.actorLink;
        case 'playerLinked': return token.actorLink && actor.hasPlayerOwner;
        case 'player': return actor.hasPlayerOwner;
        default: return false;
    }
}
async function addActions(token) {
    const actor = token.actor;
    if (!['character', 'npc'].includes(actor.type)) return;
    if (!includeActor(game.settings.get('chris-premades', 'addActions'), actor, token)) return;
    const rules = game.settings.get('dnd5e', 'rulesVersion');
    const {misc} = rules === 'legacy' ? cprConstants.packs.legacy : cprConstants.packs.modern;
    let itemDatas;
    if (game.settings.get('chris-premades', 'genericActionsItem')) {
        if (actorUtils.getItemByIdentifier(actor, 'generic-actions')) return;
        const itemData = await compendiumUtils.getDocumentByIdentifier(misc, 'generic-actions', {object: true});
        itemDatas = itemData ? [itemData] : [];
    } else {
        const actions = getActions(rules).filter(entry => !actorUtils.getItemByIdentifier(actor, entry.system.identifier));
        itemDatas = (await Promise.all(actions.map(entry => fromUuid(entry.uuid)))).map(document => document.toObject());
    }
    if (!itemDatas.length) return;
    await itemUtils.createItems(actor, itemDatas);
}
export const genericActionsHooks = {
    createToken,
    createActiveEffect
};
export const genericActions = {
    name: 'Generic Actions',
    version: '2.1.8',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorShort',
            macro: rest,
            priority: 50
        }
    ],
    config: {
        actions: {
            default: [],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.All.GenericActions.Actions',
            hint: 'CHRISPREMADES.Macros.All.GenericActions.ActionsHint',
            category: 'mechanics',
            options: item => getActionsIndex(getItemRules(item)).map(entry => ({value: entry.system.identifier, label: entry.name}))
        }
    }
};
function hideConfig(dc) {
    return {hideDC: {default: dc, type: 'formula', deterministic: true, category: 'homebrew', label: 'CHRISPREMADES.Macros.All.GenericActions.HideDC', hint: 'CHRISPREMADES.Macros.Generic.Hide.DCHint'}};
}
function labelConfig(config, labels) {
    return Object.fromEntries(Object.entries(labels).map(([key, label]) => [key, Object.defineProperties({}, {...Object.getOwnPropertyDescriptors(config[key]), label: {value: 'CHRISPREMADES.Macros.All.GenericActions.' + label, enumerable: true}})]));
}
export const genericActionsLegacy = {
    name: genericActions.name,
    version: genericActions.version,
    rules: '2014',
    config: {
        actions: genericActions.config.actions,
        ...labelConfig(knockOut.config, {attackTypes: 'KnockOutAttackTypes', promptOnZero: 'KnockOutPromptOnZero'}),
        ...labelConfig(readyItem.config, {activationTypes: 'ReadySpellActivationTypes', turnStart: 'ReadySpellTurnStart'}),
        ...hideConfig(''),
        ...labelConfig(underwaterLegacy.config, {meleeWeapons: 'UnderwaterMeleeWeapons', rangedWeapons: 'UnderwaterRangedWeapons'}),
        ...labelConfig(holdBreathLegacy.config, {startsOutOfAir: 'SuffocationStartsOutOfAir', breathFormula: 'SuffocationBreathFormula', survivalFormula: 'SuffocationSurvivalFormula'})
    }
};
export const genericActionsModern = {
    name: genericActions.name,
    version: genericActions.version,
    rules: '2024',
    config: {
        actions: genericActions.config.actions,
        ...labelConfig(knockOut.config, {attackTypes: 'KnockOutAttackTypes', promptOnZero: 'KnockOutPromptOnZero'}),
        ...labelConfig(readyItem.config, {activationTypes: 'ReadySpellActivationTypes', turnStart: 'ReadySpellTurnStart'}),
        ...hideConfig('15'),
        ...labelConfig(underwaterModern.config, {meleeDamageTypes: 'UnderwaterMeleeDamageTypes', rangedWeapons: 'UnderwaterRangedWeapons'}),
        ...labelConfig(influence.config, {minimumDC: 'InfluenceMinimumDC', skills: 'InfluenceSkills'}),
        ...labelConfig(holdBreathModern.config, {startsOutOfAir: 'SuffocationStartsOutOfAir', breathFormula: 'SuffocationBreathFormula'})
    }
};
