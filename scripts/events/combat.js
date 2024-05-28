import {macros} from '../macros.js';
import {socketUtils} from '../utilities/socketUtils.js';
import {templateUtils} from '../utilities/templateUtils.js';
import {actorUtil} from './actorUtils.js';
function getEffectTriggerData(actor) {
    return actorUtil.getEffects(actor).filter(i => i.flags['chris-premades']?.macros?.effect) ?? [];
}
function getTemplateTriggerData(scene) {
    return scene.templates.filter(i => i.flags['chris-premades']?.macros?.template) ?? [];
}




async function executeMacro(data, macro) {
    try {
        await macro(data);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.warn(error);
    }
}
async function turnEnd(combat, macros) {

}


export async function updateCombat(combat, changes, context) {
    if (!socketUtils.isTheGM()) return;
    let currentTurn = combat.current.turn;
    let previousTurn = combat.previous.turn ?? -1;
    let currentRound = combat.current.round;
    let previousRound = combat.previous.round ?? -1;
    if (!changes.turn && !changes.round) return;
    if (!combat.started || !combat.isActive) return;
    if (currentRound < previousRound || (currentTurn < previousTurn && currentTurn === previousRound)) return;
    let currentToken = game.combat.scene.tokens.get(combat.current.tokenId);
    let previousToken = game.combat.scene.tokens.get(combat.previous.tokenId);

    //Turn End Macros

}