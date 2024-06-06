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
            name: effect.name
        });
    });
    return triggers;
}
function getSortedTriggers(effect, pass) {
    let allTriggers = collectMacros(effect, pass);
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
    console.log('CPR: Executing Effect Macro: ' + trigger.macro.name);
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(effect, pass) {
    console.log('CPR: Executing Effect Macro Pass: ' + pass + ' for ' + effect.name);
    let triggers = getSortedTriggers(effect, pass).sort((a, b) => a.priority - b.priority);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    await executeMacroPass(effect, 'created');
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    await executeMacroPass(effect, 'deleted');
}
export let effectEvents = {
    createActiveEffect,
    deleteActiveEffect,
    collectEffectMacros,
    getEffectMacroData
};