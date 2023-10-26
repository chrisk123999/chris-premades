async function updateCombatant(tokenId, updates) {
    let combatant = game.combat?.combatants?.get(tokenId);
    if (!combatant) return;
    await combatant.update(updates);
}
async function createEffect(actorUuid, effectData) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
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
export let runAsGM = {
    'updateCombatant': updateCombatant,
    'updateEffect': updateEffect,
    'createEffect': createEffect,
    'removeEffect': removeEffect
}