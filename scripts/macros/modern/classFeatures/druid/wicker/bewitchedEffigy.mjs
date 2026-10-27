import {actorUtils, automationUtils, dialogUtils, documentUtils, genericUtils, itemUtils, queryUtils, rollUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Modern.BewitchedEffigy.';
export function getEffigy(item) {
    return summonUtils.getSummonsBySource(item).find(summon => summon.token);
}
export function getEntries(item) {
    return automationUtils.getGenericConfigValue(item, 'cat', 'summon', 'summons') ?? [];
}
async function getEntryIdentifiers(entry) {
    const identifiers = await Promise.all((entry.items ?? []).map(async info => info.identifier || (await fromUuid(info.uuid))?.system.identifier));
    return identifiers.filter(Boolean);
}
async function findCurrent(item, summon) {
    for (const entry of getEntries(item)) {
        const identifiers = await getEntryIdentifiers(entry);
        if (identifiers.length && identifiers.every(identifier => actorUtils.getItemByIdentifier(summon.actor, identifier))) return {entry, identifiers};
    }
}
export async function getCurrentEntry(item, summon) {
    return (await findCurrent(item, summon))?.entry;
}
async function editAura(item, summon, itemData) {
    const auraConfig = itemData.flags?.cat?.genericConfig?.cat?.aura;
    if (!auraConfig) return;
    const edits = await automationUtils.calledEvent('bewitchedEffigyAura', item.actor, {multiResult: true, canOverlap: true, data: {item, summon, itemData}}) ?? [];
    const effectData = itemData.effects?.find(effect => effect._id === auraConfig.effect);
    for (const edit of edits) {
        if (edit.changes?.length && effectData) effectData.system.changes.push(...edit.changes);
        if (edit.aura) Object.assign(auraConfig, edit.aura);
    }
}
export async function setEffigyAura(item, summon, entry) {
    const current = await findCurrent(item, summon);
    if (current) {
        const ids = summon.actor.items.filter(auraItem => current.identifiers.includes(auraItem.system.identifier)).map(auraItem => auraItem.id);
        if (ids.length) await documentUtils.deleteEmbeddedDocuments(summon.actor, 'Item', ids);
    }
    const itemDatas = (await Promise.all((entry.items ?? []).map(async info => {
        const itemData = (await fromUuid(info.uuid))?.toObject();
        if (!itemData) return;
        delete itemData._id;
        if (info.name) itemData.name = _loc(info.name);
        if (info.identifier) itemData.system.identifier = info.identifier;
        return itemData;
    }))).filter(Boolean);
    for (const itemData of itemDatas) await editAura(item, summon, itemData);
    if (itemDatas.length) await documentUtils.createEmbeddedDocuments(summon.actor, 'Item', itemDatas);
}
async function preCreate({document: item, summon, updates}) {
    for (const itemData of updates.items ?? []) await editAura(item, summon, itemData);
}
function getRadius(summon) {
    const auraItem = summon.actor.items.find(item => item.flags.cat?.genericConfig?.cat?.aura);
    if (!auraItem) return 0;
    const radius = automationUtils.getGenericConfigValue(auraItem, 'cat', 'aura', 'radius');
    return rollUtils.rollDiceSync(String(radius), {document: auraItem, options: {maximize: true}}).total;
}
async function sootheCheck({workflow}) {
    const summon = getEffigy(workflow.item);
    if (!summon) {
        genericUtils.notify(translations + 'NoEffigy', {type: 'warn'});
        return true;
    }
    const entry = await getCurrentEntry(workflow.item, summon);
    if (entry?.followUpActivityId !== workflow.activity.id) {
        genericUtils.notify(translations + 'WrongAura', {type: 'warn'});
        return true;
    }
    const target = workflow.targets.first()?.document;
    if (!target || tokenUtils.getDistance(summon.token, target) <= getRadius(summon)) return;
    genericUtils.notify(translations + 'OutsideAura', {type: 'warn'});
    return true;
}
async function soothe({workflow}) {
    const summon = getEffigy(workflow.item);
    if (!summon || !workflow.targets.size) return;
    await automationUtils.calledEvent('bewitchedEffigySoothe', workflow.actor, {canOverlap: true, data: {workflow, summon}});
}
async function sacrifice({document: effect, ditem, targetToken, workflow}) {
    if (!(ditem.totalDamage > 0)) return;
    const effigyActor = fromUuidSync(effect.flags.cat?.aura?.host ?? '', {strict: false})?.actor;
    const summon = effigyActor ? summonUtils.getSummonData(effigyActor) : undefined;
    const item = summon?.sourceDocument;
    const druid = summon?.owner;
    if (!item || !druid || workflow.item?.uuid === item.uuid) return;
    if (druid.statuses.has('incapacitated') || actorUtils.hasUsedReaction(druid)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'sacrifice');
    if (!activity) return;
    const target = targetToken.document ?? targetToken;
    const selection = await dialogUtils.confirm(item.name, _loc(translations + 'Sacrifice', {name: target.name}), {userId: queryUtils.firstOwner(druid, true)});
    if (!selection) return;
    await workflowUtils.completeActivityUse(activity, [target]);
}
export const bewitchedEffigy = {
    name: 'Bewitched Effigy',
    version: '2.1.4',
    rules: '2024',
    notes: 'Use the "actorBewitchedEffigyAura" called event (async) to edit an aura item before it is added to the effigy. Return {changes: [effect changes added to the aura effect], aura: {aura config keys to override}}.\n\tData available: item, summon, itemData.\nUse "actorBewitchedEffigySoothe" (async) to respond after Soothe restores Hit Points.\n\tData available: summon, workflow.',
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: sootheCheck,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: soothe,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'preCreate',
            macro: preCreate,
            priority: 50
        }
    ]
};
export const bewitchedEffigySacrifice = {
    name: 'Bewitched Effigy: Sacrifice',
    version: bewitchedEffigy.version,
    rules: bewitchedEffigy.rules,
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: sacrifice,
            priority: 400
        }
    ]
};
