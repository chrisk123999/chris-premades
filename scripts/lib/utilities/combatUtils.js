function currentTurn() {
    return game.combat.round + '-' + game.combat.turn;
}
function inCombat() {
    return !!game.combat;
}
function combatStarted() {
    if (!inCombat()) return false;
    return game.combat.started;
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
    let currCombatant = game.combat?.combatants.get(game.combat?.current?.combatantId);
    return game.scenes.get(currCombatant?.sceneId)?.tokens.get(currCombatant?.tokenId)?.object;
}
function isOwnTurn(token) {
    if (!inCombat()) return true;
    return token.document.id === game.combat.current.tokenId;
}
export let combatUtils = {
    currentTurn,
    inCombat,
    combatStarted,
    perTurnCheck,
    setTurnCheck,
    getCurrentCombatantToken,
    isOwnTurn
};