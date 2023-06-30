async function updateCombatant(tokenId, updates) {
    let combatant = game.combat?.combatants?.get(tokenId);
    if (!combatant) return;
    await combatant.update(updates);
}
export let runAsGM = {
    'updateCombatant': updateCombatant
}