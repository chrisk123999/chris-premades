function currentTurn() {
    return game.combat.round + '-' + game.combat.turn;
}
function inCombat() {
    return !!game.combat;
}
export let combatUtils = {
    currentTurn,
    inCombat
};