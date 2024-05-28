import {macros} from '../macros.js';
import {actorUtils} from '../utilities/actorUtils.js';
import {socketUtils} from '../utilities/socketUtils.js';
import {templateUtils} from '../utilities/templateUtils.js';
import {effectUtils} from '../utilities/effectUtils.js';
function getEffectMacroData(effect) {
    return effect.flags['chris-premades']?.macros?.effect ?? [];
}
function getTemplateMacroData(template) {
    return effect.flags['chris-premades']?.macros?.template ?? [];
}
function collectEffectMacros(effect) {
    let macroList = [];
    macroList.push(...getEffectMacroData(effect));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTemplateMacros(template) {
    let macroList = [];
    macroList.push(...getTemplateMacroData(template));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTokenMacros(token, pass) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects();
        for (let effect of effects) {
            let macroList = collectEffectMacros(effect);
            if (!macroList.length) continue;
            let effectMacros = macroList.filter(i => i.effect?.find(j => j.pass === pass)).map(k => k.effect).flat().filter(l => l.pass === pass);

            let castData = {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1
            };


        }
    }
}


async function turnEnd(combat, token) {

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
    let currentToken = combat.scene.tokens.get(combat.current.tokenId);
    let previousToken = combat.scene.tokens.get(combat.previous.tokenId);

    //Turn End Macros

}