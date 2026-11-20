import {activityUtils, actorUtils, documentUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.EyesOfTheGate.';
const eyesIdentifier = 'interdict-boons-eyes-of-the-gate';
const perceiveIdentifier = 'eyesOfTheGatePerceiving';
export function getBond(actor) {
    const uuid = actorUtils.getItemByIdentifier(actor, eyesIdentifier)?.flags['chris-premades']?.eyesOfTheGate?.bond;
    return uuid ? fromUuidSync(uuid, {strict: false}) : undefined;
}
export function getBondToken(actor) {
    const bond = getBond(actor);
    return bond?.parent ? actorUtils.getFirstToken(bond.parent) : undefined;
}
export async function markAware(actor) {
    const bond = getBond(actor);
    if (!bond || bond.flags['chris-premades']?.eyesOfTheGate?.aware) return;
    const item = actorUtils.getItemByIdentifier(actor, eyesIdentifier);
    await documentUtils.setFlag(bond, 'chris-premades', 'eyesOfTheGate.aware', true);
    const activityId = foundry.utils.randomID();
    await documentUtils.createEmbeddedDocuments(bond.parent, 'Item', [{
        name: _loc(translations + 'Break', {name: item.name}),
        type: 'feat',
        img: item.img,
        system: {activities: {[activityId]: {
            _id: activityId,
            type: 'save',
            activation: {type: 'action', value: 1},
            range: {units: 'self'},
            target: {affects: {type: 'self'}},
            save: {ability: ['wis'], dc: {calculation: '', formula: String(bond.flags['chris-premades'].eyesOfTheGate.dc)}},
            damage: {onSave: 'none', parts: []}
        }}},
        flags: {
            'chris-premades': {eyesOfTheGateBreak: bond.uuid},
            cat: {macros: {roll: [{source: 'chris-premades', identifier: 'eyes-of-the-gate-break', rules: '2014'}]}}
        }
    }]);
}
async function perceive(item, workflow) {
    const actor = item.actor;
    const existing = actorUtils.getEffectByIdentifier(actor, perceiveIdentifier);
    if (existing) return await documentUtils.deleteDocument(existing);
    const bondToken = getBondToken(actor);
    if (!bondToken) return genericUtils.notify(translations + 'NoBond', {type: 'info'});
    const ownerToken = workflow.token?.document;
    if (!ownerToken || ownerToken.parent !== bondToken.parent || !tokenUtils.isWithinDistance(ownerToken, bondToken, 300)) return genericUtils.notify(translations + 'TooFar', {type: 'info'});
    const users = game.users.filter(user => !user.isGM && actor.testUserPermission(user, 'OWNER'));
    const prior = Object.fromEntries(users.map(user => [user.id, bondToken.actor.ownership[user.id] ?? null]));
    await documentUtils.update(bondToken.actor, {ownership: Object.fromEntries(users.map(user => [user.id, Math.max(prior[user.id] ?? 0, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)]))});
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {name: item.name, img: item.img, origin: item.uuid, identifier: perceiveIdentifier});
    effectData.statuses = ['blinded', 'deafened'];
    genericUtils.setProperty(effectData, 'flags.chris-premades.eyesOfTheGate', {actor: bondToken.actor.uuid, prior});
    genericUtils.setProperty(effectData, 'flags.cat.macros.effect', [{source: 'chris-premades', identifier: 'eyes-of-the-gate-perceiving', rules: '2014'}]);
    await effectUtils.createEffects(actor, [effectData]);
    canvas.tokens.releaseAll();
    if (bondToken.object) await canvas.animatePan(bondToken.object.center);
}
async function bind(item, workflow) {
    const target = workflow.failedSaves.documents[0];
    if (!target?.actor) return;
    const bond = actorUtils.getEffects(target.actor).find(effect => effectUtils.getOriginActivitySync(effect)?.uuid === workflow.activity.uuid);
    if (!bond) return;
    const previous = getBond(item.actor);
    await documentUtils.setFlag(item, 'chris-premades', 'eyesOfTheGate.bond', bond.uuid);
    if (previous && previous !== bond) await documentUtils.deleteDocument(previous);
    const seals = 1 + Number(bond.flags.dnd5e?.scaling ?? 0);
    await documentUtils.update(bond, {duration: {value: seals, units: 'hours'}, 'flags.chris-premades.eyesOfTheGate': {dc: workflow.activity.save.dc.value, aware: false}});
}
async function used({document: item, workflow}) {
    if (workflow.activity.identifier === 'perceive') return await perceive(item, workflow);
    if (workflow.activity.identifier === 'seal') return await sealThroughBond(item, workflow);
    if (workflow.activity.identifier === 'use') await bind(item, workflow);
}
export function throughBond(actor, target, range) {
    const bondToken = getBondToken(actor);
    const ownerToken = actorUtils.getFirstToken(actor);
    if (!bondToken || !target || bondToken.parent !== target.parent || !range) return false;
    if (ownerToken && tokenUtils.isWithinDistance(ownerToken, target, range)) return false;
    return tokenUtils.isWithinDistance(bondToken, target, range) && tokenUtils.canSee(bondToken, target);
}
export async function rollThroughBond(activity, targets, options = {}) {
    const activityData = activity.toObject();
    activityData.range = {units: 'any', special: '', override: true};
    const result = await workflowUtils.syntheticActivityDataRoll(activityData, activity.item, targets, {consumeResources: true, ...options});
    await markAware(activity.actor);
    return result;
}
async function sealThroughBond(item, workflow) {
    const target = workflow.targets.documents[0];
    const baleful = actorUtils.getItemByIdentifier(item.actor, 'baleful-interdict');
    const place = baleful && itemUtils.getActivityByIdentifier(baleful, 'place');
    if (!target || !place) return;
    if (!throughBond(item.actor, target, activityUtils.getRange(place))) return genericUtils.notify(translations + 'OutOfRange', {type: 'info'});
    await rollThroughBond(place, [target]);
}
async function bondEnded({document: bond}) {
    const item = effectUtils.getOriginActivitySync(bond)?.item;
    if (item?.flags['chris-premades']?.eyesOfTheGate?.bond === bond.uuid) await documentUtils.setFlag(item, 'chris-premades', 'eyesOfTheGate.bond', null);
    const perceiving = item?.actor && actorUtils.getEffectByIdentifier(item.actor, perceiveIdentifier);
    if (perceiving?.flags['chris-premades']?.eyesOfTheGate?.actor === bond.parent?.uuid) await documentUtils.deleteDocument(perceiving);
    const breakItems = bond.parent?.items?.filter(entry => entry.flags['chris-premades']?.eyesOfTheGateBreak === bond.uuid) ?? [];
    await Promise.all(breakItems.map(entry => documentUtils.deleteDocument(entry)));
}
async function perceivingEnded({document: effect}) {
    const {actor: uuid, prior = {}} = effect.flags['chris-premades']?.eyesOfTheGate ?? {};
    const bonded = uuid ? fromUuidSync(uuid, {strict: false}) : undefined;
    if (!bonded) return;
    const fallback = bonded.ownership.default ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
    await documentUtils.update(bonded, {ownership: Object.fromEntries(Object.entries(prior).map(([userId, level]) => [userId, level ?? fallback]))});
}
async function breakBond({document: item, workflow}) {
    if (!workflow.saves.size) return;
    const bond = fromUuidSync(item.flags['chris-premades']?.eyesOfTheGateBreak ?? '', {strict: false});
    if (bond) await documentUtils.deleteDocument(bond);
}
export const eyesOfTheGate = {
    name: 'Interdict Boons: Eyes of the Gate',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: used,
            priority: 50
        }
    ]
};
export const eyesOfTheGateBond = {
    name: 'Interdict Boons: Eyes of the Gate: Bond',
    version: '2.1.10',
    rules: '2014',
    effect: [
        {
            pass: 'deleted',
            macro: bondEnded,
            priority: 50
        }
    ]
};
export const eyesOfTheGatePerceiving = {
    name: 'Interdict Boons: Eyes of the Gate: Perceiving',
    version: '2.1.10',
    rules: '2014',
    effect: [
        {
            pass: 'deleted',
            macro: perceivingEnded,
            priority: 50
        }
    ]
};
export const eyesOfTheGateBreak = {
    name: 'Interdict Boons: Eyes of the Gate: Break Bond',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: breakBond,
            priority: 50
        }
    ]
};
