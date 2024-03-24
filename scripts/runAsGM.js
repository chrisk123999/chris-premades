import {chris} from './helperFunctions.js';
async function updateCombatant(uuid, updates) {
    let combatant = await fromUuid(uuid);
    if (!combatant) return;
    await combatant.update(updates);
}
async function createEffect(actorUuid, effectData) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    if (actor instanceof TokenDocument) actor = actor.actor;
    if (!actor) return;
    let effects = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
    return effects[0].uuid;
}
async function removeEffect(effectUuid) {
    let effect = await fromUuid(effectUuid);
    if (!effect) return;
    await effect.delete();
}
async function updateEffect(effectUuid, updates) {
    let effect = await fromUuid(effectUuid);
    if (!effect) return;
    await effect.update(updates);
}
async function createFolder(folderData) {
    return await Folder.create(folderData);
}
async function createActor(actorData) {
    return await Actor.create(actorData);
}
function updateInitiative(combatantUuid, initiative) {
    let combatant = fromUuidSync(combatantUuid);
    if (!combatant) return;
    combatant.update({'initiative': initiative});
}
export let runAsGM = {
    'updateCombatant': updateCombatant,
    'updateEffect': updateEffect,
    'createEffect': createEffect,
    'removeEffect': removeEffect,
    'createFolder': createFolder,
    'createActor': createActor,
    'updateInitiative': updateInitiative,
};
async function rollItem(itemUuid, config, options) {
    let item = await fromUuid(itemUuid);
    if (!item) return;
    return await chris.rollItem(item, config, options);
}
export let runAsUser = {
    'rollItem': rollItem
};