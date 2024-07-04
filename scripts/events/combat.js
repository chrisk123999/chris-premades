import * as macros from '../macros.js';
import {actorUtils, socketUtils, templateUtils, effectUtils, genericUtils, tokenUtils} from '../utils.js';
import {templateEvents} from './template.js';
function getMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.combat ?? [];
}
function collectMacros(entity) {
    let macroList = [];
    macroList.push(...getMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTokenMacros(token, pass, distance, target) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor);
        for (let effect of effects) {
            let macroList = collectMacros(effect);
            if (!macroList.length) continue;
            let effectMacros = macroList.filter(i => i.combat?.find(j => j.pass === pass)).map(k => k.combat).flat().filter(l => l.pass === pass);
            effectMacros.forEach(i => {
                if (distance && i.distance < distance) return;
                if (i.disposition) {
                    if (i.disposition === 'ally' && token.disposition != target.disposition) return;
                    if (i.disposition === 'enemy' && token.disposition === target.disposition) return;
                }
                triggers.push({
                    entity: effect,
                    castData: {
                        castLevel: effectUtils.getCastLevel(effect) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                        saveDC: effectUtils.getSaveDC(effect) ?? -1
                    },
                    macro: i.macro,
                    name: effect.name,
                    priority: i.priority,
                    token: token.object,
                    target: target.object,
                    distance: distance
                });
            });
        }
        for (let item of token.actor.items) {
            let macroList = collectMacros(item);
            if (!macroList.length) continue;
            let itemMacros = macroList.filter(i => i.combat?.find(j => j.pass === pass)).map(k => k.combat).flat().filter(l => l.pass === pass);
            itemMacros.forEach(i => {
                if (distance && i.distance < distance) return;
                if (i.disposition) {
                    if (i.disposition === 'ally' && token.disposition != target.disposition) return;
                    if (i.disposition === 'enemy' && token.disposition === target.disposition) return;
                }
                triggers.push({
                    entity: item,
                    castData: {
                        castLevel: -1,
                        saveDC: -1
                    },
                    macro: i.macro,
                    name: item.name,
                    priority: i.priority,
                    token: token.object,
                    target: target.object,
                    distance: distance
                });
            });
        }
    }
    let templates = templateUtils.getTemplatesInToken(token.object);
    for (let template of templates) {
        let macroList = templateEvents.collectMacros(template);
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
                name: templateUtils.getName(template),
                priority: i.priority,
                token: token.object,
                target: target.object,
                distance: distance
            });
        });
    }
    return triggers;
}
function getSortedTriggers(tokens, pass, token) {
    let allTriggers = [];
    tokens.forEach(i => {
        let distance;
        if (token) {
            distance = tokenUtils.getDistance(token.object, i.object, {wallsBlock: true});
            if (distance < 0) return;
        }
        allTriggers.push(...collectTokenMacros(i, pass, distance, token));
    });
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
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    console.log('CPR: Executing Combat Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        await trigger.macro({trigger});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(tokens, pass, token) {
    console.log('CPR: Executing Combat Macro Pass: ' + pass);
    let triggers = getSortedTriggers(tokens, pass, token);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function updateCombat(combat, changes, context) {
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
    if (previousToken) await executeMacroPass([previousToken], 'turnEnd');
    if (currentToken) await executeMacroPass([currentToken], 'turnStart');
    for (let token of combat.scene.tokens) await executeMacroPass([token], 'everyTurn');
    if (currentToken) await executeMacroPass(combat.scene.tokens.filter(i => i != currentToken), 'everyTurnNear', currentToken);
}
async function combatStart(combat, changes) {
    if (!socketUtils.isTheGM()) return;
    let tokens = combat.combatants.map(i => combat.scene.tokens.get(i.tokenId)).filter(j => j);
    for (let i of tokens) await executeMacroPass([i], 'combatStart');
}
async function deleteCombat(combat, changes, context) {
    if (!socketUtils.isTheGM()) return;
    let tokens = combat.combatants.map(i => combat.scene.tokens.get(i.tokenId)).filter(j => j);
    for (let i of tokens) await executeMacroPass([i], 'combatEnd'); //The last turnEnd macro may need to be run before this?
}
export let combatEvents = {
    combatStart,
    deleteCombat,
    updateCombat,
    executeMacroPass,
    collectMacros
};