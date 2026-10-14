import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
function getOtherActivityIdentifiers(document, {placeActivityId, recallActivityId, moveActivityId, followUpActivityId}) {
    return [placeActivityId, recallActivityId, moveActivityId, followUpActivityId].map(id => document.system.activities.get(id)).filter(Boolean).map(activity => documentUtils.getIdentifier(activity));
}
function getCastLevel(document, workflow) {
    const scaling = effectUtils.getConcentrationEffect(workflow.actor, document)?.flags.dnd5e?.scaling;
    if (scaling !== undefined) return (document.system.level ?? 0) + scaling;
    return Math.max(workflowUtils.getCastLevel(workflow) ?? -1, document.system.level ?? 0);
}
function resolveFormula(formula, rollData) {
    return new Roll(String(formula), rollData).evaluateSync({strict: false}).total;
}
function getActorUpdates(actorUpdates, rollData) {
    return genericUtils.expandObject(Object.fromEntries(Object.entries(actorUpdates ?? {}).map(([key, value]) => [key, typeof value === 'string' ? resolveFormula(value, rollData) : value])));
}
function scaleItem(itemData, {damageNumber, damageBonus, healingNumber, usesMax}, rollData) {
    Object.values(itemData.system.activities ?? {}).forEach(activityData => {
        activityData.damage?.parts?.forEach(part => {
            if (damageNumber) part.number = resolveFormula(damageNumber, rollData);
            if (damageBonus) part.bonus = Roll.replaceFormulaData(String(damageBonus), rollData);
        });
        if (healingNumber && activityData.healing) activityData.healing.number = resolveFormula(healingNumber, rollData);
    });
    if (!usesMax) return;
    genericUtils.setProperty(itemData, 'system.uses.max', String(resolveFormula(usesMax, rollData)));
    genericUtils.setProperty(itemData, 'system.uses.spent', 0);
}
async function followUp(document, config, timing) {
    if (!['both', timing].includes(config.followUpTiming)) return;
    const activity = document.system.activities.get(config.followUpActivityId);
    if (!activity) return;
    const userId = queryUtils.firstOwner(document.actor, true);
    const baseLevel = document.system.level ?? 0;
    for (const summon of summonUtils.getSummonsBySource(document).filter(summon => summon.token)) {
        const nearby = tokenUtils.findNearby(summon.token, config.followUpRange);
        if (!nearby.length) {
            Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'No follow-up targets near the summon.');
            continue;
        }
        const selection = await dialogUtils.selectTargetDialog(activity.name, 'CHRISPREMADES.Macros.Generic.Summon.FollowUpTarget', nearby, {skipDeadAndUnconscious: false, userId});
        if (!selection?.result) continue;
        const scaling = Math.max(0, (actorUtils.getSavedCastData(summon.actor)?.castLevel ?? baseLevel) - baseLevel);
        await workflowUtils.completeActivityUse(activity, [selection.result], {config: {scaling}, consumeUsage: false, consumeResources: false, spellSlot: false, userId});
    }
}
async function use({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summon', configKeys);
    if (config.activityId != workflow.activity.id) return;
    if (!config.summons.length) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'No summon creatures configured.', {notify: 'warn'});
    const oldSummons = config.replaceExisting ? summonUtils.getSummonsBySource(document) : [];
    const duration = activityUtils.getDuration(workflow.activity);
    const parent = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const castLevel = getCastLevel(document, workflow);
    const rollData = {...workflow.activity.getRollData(), castLevel};
    const castData = {castLevel, baseLevel: document.system.level ?? 0, saveDC: itemUtils.getSaveDC(document)};
    const summons = (await Promise.all(config.summons.map(async summonData => {
        const {sourceActorUuid, name, avatarImg, tokenImg, animation, sounds, items, initiative, disposition, actorUpdates} = summonData;
        const sourceActor = await fromUuid(sourceActorUuid);
        if (!sourceActor) return;
        const updates = genericUtils.mergeObject(getActorUpdates(actorUpdates, rollData), {flags: {cat: {castData}}});
        return await summonUtils.createSummon(workflow.actor, sourceActor, {duration, avatarImg, tokenImg, name, animation, parent, sounds, sourceDocument: document, items, initiative, disposition, updates});
    }))).filter(Boolean);
    if (!summons.length) return;
    const otherActivityIdentifiers = getOtherActivityIdentifiers(document, config);
    if (otherActivityIdentifiers.length) await itemUtils.unhideActivities(document, otherActivityIdentifiers, {favorite: config.favorite ?? false});
    await Promise.all(oldSummons.map(summon => summonUtils.deleteSummon(summon)));
    if (!workflow.token) return;
    await summonUtils.placeSummons(summons, workflow.activity.range.value, {token: workflow.token.document});
    await followUp(document, config, 'create');
}
async function preCreate({document, summon, updates}) {
    if (!updates.items) return;
    const summons = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summons') ?? [];
    const scaledItems = summons.find(summonData => summonData.sourceActorUuid === summon.sourceActorUuid)?.items?.filter(itemInfo => itemInfo.uuid && itemInfo.scaling) ?? [];
    if (!scaledItems.length) return;
    const castLevel = updates.flags?.cat?.castData?.castLevel ?? (document.system.level ?? 0) + (summon.parent?.flags.dnd5e?.scaling ?? 0);
    const rollData = {...(document.system.activities?.get(automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'activityId'))?.getRollData() ?? document.getRollData()), castLevel};
    for (const itemInfo of scaledItems) {
        const sourceItem = await fromUuid(itemInfo.uuid);
        if (!sourceItem) continue;
        updates.items.filter(itemData => (itemData.system?.identifier || itemData.name?.slugify({strict: true})) === sourceItem.identifier).forEach(itemData => scaleItem(itemData, itemInfo.scaling, rollData));
    }
}
async function place({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'placeActivityId');
    if (activityId != workflow.activity.id) return;
    await summonUtils.placeAllSourceSummons(document, workflow.activity.range.value, {token: workflow.token.document});
}
async function recall({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'recallActivityId');
    if (activityId != workflow.activity.id) return;
    await summonUtils.recallAllSourceSummons(document);
}
async function move({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summon', configKeys);
    if (config.moveActivityId != workflow.activity.id) return;
    const summons = summonUtils.getSummonsBySource(document).filter(summon => summon.token);
    for (const summon of summons) await summon.move(workflow.activity.range.value, {token: workflow.token?.document});
    await leash({document});
    await followUp(document, config, 'move');
}
async function leash({document}) {
    const maxDistance = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'maxDistance');
    const token = actorUtils.getFirstToken(document.actor);
    if (!maxDistance || !token) return;
    const summons = summonUtils.getSummonsBySource(document).filter(summon => summon.token && tokenUtils.getDistance(token, summon.token) > maxDistance);
    await Promise.all(summons.map(summon => summonUtils.deleteSummon(summon)));
}
async function deleted({document, summon}) {
    const summons = summonUtils.getSummonsBySource(document).filter(i => i !== summon);
    if (summons.length) return;
    await effectUtils.endConcentration(summon.owner, summon.sourceDocument);
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summon', configKeys);
    const otherActivityIdentifiers = getOtherActivityIdentifiers(document, config);
    if (!otherActivityIdentifiers.length) return;
    await itemUtils.rehideActivities(document, otherActivityIdentifiers, {favorite: config.favorite ?? false});
}
/**
 * Creates summons from this item and handles placing, recalling, moving and dismissing them.
 * Bound on an item. Fires on `itemRollFinished`, `nearbyMoved`, `preCreate` and `delete`.
 * Creating summons unhides the place, recall, move and follow-up activities.
 * Summon formulas resolve on the caster's item roll data plus `@castLevel`.
 * Each `summons` entry also takes `disposition` (token disposition, defaults to the caster's) and `actorUpdates` (actor data paths to formula strings).
 * Each summon `items` entry also takes `scaling`: `damageNumber` and `damageBonus` replace every damage part's dice count and bonus, `healingNumber` replaces the healing dice count and `usesMax` sets max uses.
 * When the last summon is deleted, concentration ends and those activities are hidden again.
 *
 * Config:
 * - `activityId`: activity that creates the summons.
 * - `placeActivityId`: activity that places this item's summons within its range.
 * - `recallActivityId`: activity that recalls this item's summons.
 * - `moveActivityId`: rolling this activity moves this item's placed summons up to the activity's range.
 * - `summons`: summons created by the create activity.
 * - `maxDistance`: summons farther than this many feet from the summoner are dismissed when either moves. 0 disables it.
 * - `replaceExisting`: dismiss this item's existing summons before creating new ones.
 * - `favorite`: favorite the unhidden activities.
 * - `followUpActivityId`: activity rolled on a creature picked within `followUpRange` of each summon, without spending uses or slots.
 * - `followUpTiming`: roll the follow-up after summoning, after moving, or both.
 * - `followUpRange`: feet from the summon a follow-up target can be picked.
 */
export const summon = {
    rules: 'all',
    version: '2.1.3',
    category: 'summons',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: place,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: recall,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: move,
            priority: 50
        }
    ],
    move: [
        {
            pass: 'nearbyMoved',
            macro: leash,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'preCreate',
            macro: preCreate,
            priority: 50
        },
        {
            pass: 'delete',
            macro: deleted,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.CreateActivity',
            hint: ''
        },
        placeActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.PlaceActivity',
            hint: ''
        },
        recallActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.RecallActivity',
            hint: ''
        },
        moveActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Macros.Generic.Summon.MoveActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.MoveActivityHint'
        },
        summons: {
            default: [],
            type: 'selectSummons',
            label: 'CHRISPREMADES.Config.Summons',
            hint: ''
        },
        maxDistance: {
            default: 0,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Generic.Summon.MaxDistance',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.MaxDistanceHint'
        },
        replaceExisting: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Generic.Summon.ReplaceExisting',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.ReplaceExistingHint'
        },
        favorite: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.FavoriteActivities',
            hint: ''
        },
        followUpActivityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpActivityHint'
        },
        followUpTiming: {
            default: 'both',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpTiming',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpTimingHint',
            get options() { return ['both', 'create', 'move'].map(value => ({value, label: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpTimingOptions.' + value})); }
        },
        followUpRange: {
            default: 5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpRange',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.FollowUpRangeHint'
        }
    }
};
const configKeys = Object.keys(summon.genericConfig);
