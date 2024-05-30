import {macros} from '../macros.js';
import {actorUtils} from '../utilities/actorUtils.js';
import {socketUtils} from '../utilities/socketUtils.js';
import {templateUtils} from '../utilities/templateUtils.js';
import {effectUtils} from '../utilities/effectUtils.js';
import {genericUtils} from '../utilities/genericUtils.js';
function getEffectMacroData(effect) {
    return effect.flags['chris-premades']?.macros?.effect ?? [];
}
function getTemplateMacroData(template) {
    return template.flags['chris-premades']?.macros?.template ?? [];
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
        let effects = actorUtils.getEffects(token.actor);
        for (let effect of effects) {
            let macroList = collectEffectMacros(effect);
            if (!macroList.length) continue;
            let effectMacros = macroList.filter(i => i.effect?.find(j => j.pass === pass)).map(k => k.effect).flat().filter(l => l.pass === pass);
            effectMacros.forEach(i => {
                triggers.push({
                    entity: effect,
                    castData: {
                        castLevel: effectUtils.getCastLevel(effect) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                        saveDC: effectUtils.getSaveDC(effect) ?? -1
                    },
                    macro: i.macro,
                    name: effect.name
                });
            });
        }
    }
    let templates = templateUtils.getTemplatesInToken(token);
    for (let template of templates) {
        let macroList = collectTemplateMacros(template);
        if (!macroList.length) continue;
        let templateMacros = macroList.filter(i => i.template?.find(j => j.pass === pass)).map(k => k.template).flat().filter(l => l.pass === pass);
        templateMacros.forEach(i => {
            triggers.push({
                entity: template,
                castData: {
                    castLevel: templateUtils.getCastLevel(template) ?? -1,
                    saveDC: templateUtils.getSaveDC(template) ?? -1
                },
                macro: i.macro,
                name: templateUtils.getName(template)
            });
        });
    }
    return triggers;
}
function getSortedTriggers(token, pass) {
    let allTriggers = collectTokenMacros(token, pass);
    let names = new Set(allTriggers.map(i => i.name));
    let maxMap = {};
    names.forEach(i => {
        let maxLevel = Math.max(...allTriggers.map(i => i.castData.castLevel));
        let maxDC = Math.max(...allTriggers.map(i => i.castData.saveDC));
        maxMap[i] = {
            maxLevel: maxLevel,
            maxDC: maxDC
        };
    });
    let triggers = [];
    names.forEach(i => {
        let maxLevel = maxMap[i].maxLevel;
        let maxDC = maxMap[i].maxDC;
        let maxDCTrigger = allTriggers.find(j => j.castData.saveDC === maxDC);
        let selectedTrigger;
        if (maxDCTrigger.castData.castLevel === maxLevel) {
            selectedTrigger = maxDCTrigger;
        } else {
            selectedTrigger = allTriggers.find(j => j.castData.castLevel === maxLevel);
        }
        triggers.push(selectedTrigger);
    });
    return triggers;
}
async function executeMacro(trigger) {
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(token, pass) {
    let triggers = getSortedTriggers(token, pass).sort((a, b) => a.priority - b.priority);
    for (let i of triggers) await executeMacro(i);
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
    let currentToken = combat.scene.tokens.get(combat.current.tokenId)?.object;
    let previousToken = combat.scene.tokens.get(combat.previous.tokenId)?.object;
    await genericUtils.sleep(50);
    await executeMacroPass(previousToken, 'turnEnd');
    await executeMacroPass(currentToken, 'turnStart');
    //Turn End Macros

}