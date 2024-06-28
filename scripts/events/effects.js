import * as macros from '../macros.js';
import {effectUtils, genericUtils, socketUtils} from '../utils.js';
function getEffectMacroData(effect) {
    return effect.flags['chris-premades']?.macros?.effect ?? [];
}
function collectEffectMacros(effect) {
    let macroList = [];
    macroList.push(...getEffectMacroData(effect));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectMacros(effect, pass) {
    let macroList = collectEffectMacros(effect);
    if (!macroList.length) return [];
    let triggers = [];
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
            name: effect.name,
            priority: i.priority
        });
    });
    return triggers;
}
function getSortedTriggers(effect, pass) {
    let allTriggers = collectMacros(effect, pass);
    let names = new Set(allTriggers.map(i => i.name));
    let bestMap = {};
    names.forEach(name => {
        let allRelevantTriggers = allTriggers.filter(i => i.name === name);
        let maxDC = Math.max(...allRelevantTriggers.map(i => i.castData.saveDC));
        let minDC = Math.min(...allRelevantTriggers.map(i => i.castData.saveDC));
        let bestEntity;
        if (maxDC === minDC) {
            let maxLevel = Math.max(...allRelevantTriggers.map(i => i.castData.castLevel));
            bestEntity = allRelevantTriggers.find(i => i.castData.castLevel === maxLevel).entity;
        } else {
            bestEntity = allRelevantTriggers.find(i => i.castData.saveDC === maxDC);
        }
        bestMap[name] = bestEntity;
    });
    let triggers = [];
    names.forEach(name => {
        let bestEntity = bestMap[name];
        let bestTriggers = allTriggers.filter(i => i.name === name).filter(i => i.entity === bestEntity);
        triggers.push(...bestTriggers);
    });
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    console.log('CPR: Executing Effect Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(effect, pass) {
    console.log('CPR: Executing Effect Macro Pass: ' + pass + ' for ' + effect.name);
    let triggers = getSortedTriggers(effect, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    await executeMacroPass(effect, 'created');
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    await executeMacroPass(effect, 'deleted');
}
export let effectEvents = {
    createActiveEffect,
    deleteActiveEffect,
    collectEffectMacros,
    getEffectMacroData
};