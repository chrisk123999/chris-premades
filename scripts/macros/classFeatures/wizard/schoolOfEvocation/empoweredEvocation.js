import {chris} from '../../../../helperFunctions.js';
let previousTurn;
export function empoweredEvocation(item) {
    if (chris.inCombat()) {
        let currentTurn = game.combat.round + '-' + game.combat.turn;
        if (previousTurn === currentTurn) return false;
    }
    let value = (item.type === 'spell' && item.system?.school === 'evo') || item.flags?.['chris-premades']?.spell?.castData?.school === 'evo';
    if (value && chris.inCombat()) previousTurn = currentTurn;
    return value;
}