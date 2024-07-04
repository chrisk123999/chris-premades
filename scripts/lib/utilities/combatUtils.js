function currentTurn() {
    return game.combat.round + '-' + game.combat.turn;
}
function inCombat() {
    return !!game.combat;
}
function perTurnCheck(entity, name, ownTurnOnly, tokenId) {
    if (!inCombat()) return true;
    if (ownTurnOnly && (tokenId !== game.combat.current.tokenId)) return false;
    let previousTurn = entity.flags['chris-premades']?.[name]?.turn;
    return currentTurn() !== previousTurn;
}
async function setTurnCheck(entity, name, reset) {
    let turn = '';
    if (combatUtils.inCombat() && !reset) turn = game.combat.round + '-' + game.combat.turn;
    await entity.setFlag('chris-premades', name + '.turn', turn);
}
function getCurrentCombatantToken() {
    return game.combat.scene.tokens.get(game.combat.current.tokenId).object;
}
export let combatUtils = {
    currentTurn,
    inCombat,
    perTurnCheck,
    setTurnCheck,
    getCurrentCombatantToken
};