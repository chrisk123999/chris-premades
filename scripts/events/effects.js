import {custom} from './custom.js';
import {effects} from '../extensions/effects.js';
import * as macros from '../macros.js';
import {effectUtils, genericUtils, macroUtils, socketUtils} from '../utils.js';
import {auras} from './auras.js';
import {death} from './death.js';
function getEffectMacroData(effect) {
    return effect.flags['chris-premades']?.macros?.effect ?? [];
}
function collectEffectMacros(effect) {
    let macroList = [];
    macroList.push(...getEffectMacroData(effect));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(effect))).filter(j => j);
}
function collectMacros(effect, pass) {
    let macroList = collectEffectMacros(effect);
    let triggers = [];
    if (macroList.length) {
        let effectMacros = macroList.filter(i => i.effect?.find(j => j.pass === pass)).flatMap(k => k.effect).filter(l => l.pass === pass);
        if (effectMacros.length) {
            triggers.push({
                entity: effect,
                castData: {
                    castLevel: effectUtils.getCastLevel(effect) ?? -1,
                    baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                    saveDC: effectUtils.getSaveDC(effect) ?? -1
                },
                macros: effectMacros,
                name: effect.name.slugify()
            });
        }
    }
    let embeddedMacros = macroUtils.getEmbeddedMacros(effect, 'effect', {pass});
    if (embeddedMacros.length) {
        triggers.push({
            entity: effect,
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            },
            macros: embeddedMacros,
            name: effect.name.slugify()
        });
    }
    return triggers;
}
function getSortedTriggers(effect, pass) {
    let allTriggers = collectMacros(effect, pass);
    let names = new Set(allTriggers.map(i => i.name));
    allTriggers = Object.fromEntries(names.map(i => [i, allTriggers.filter(j => j.name === i)]));
    let maxMap = {};
    names.forEach(i => {
        let maxLevel = Math.max(...allTriggers[i].map(i => i.castData.castLevel));
        let maxDC = Math.max(...allTriggers[i].map(i => i.castData.saveDC));
        maxMap[i] = {
            maxLevel: maxLevel,
            maxDC: maxDC
        };
    });
    let triggers = [];
    names.forEach(i => {
        let maxLevel = maxMap[i].maxLevel;
        let maxDC = maxMap[i].maxDC;
        let maxDCTrigger = allTriggers[i].find(j => j.castData.saveDC === maxDC);
        let selectedTrigger;
        if (maxDCTrigger.castData.castLevel === maxLevel) {
            selectedTrigger = maxDCTrigger;
        } else {
            selectedTrigger = allTriggers[i].find(j => j.castData.castLevel === maxLevel);
        }
        triggers.push(selectedTrigger);
    });
    let sortedTriggers = [];
    triggers.forEach(trigger => {
        trigger.macros.forEach(macro => {
            sortedTriggers.push({
                entity: trigger.entity,
                castData: trigger.castData,
                macro: macro.macro,
                priority: macro.priority,
                name: trigger.name,
                macroName: typeof macro.macro === 'string' ? macro.macro : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    genericUtils.log('dev', 'Executing Effect Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        if (typeof trigger.macro === 'string') {
            await custom.executeScript({script: trigger.macro, trigger});
        } else {
            await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(effect, pass) {
    genericUtils.log('dev', 'Executing Effect Macro Pass: ' + pass + ' for ' + effect.name);
    let triggers = getSortedTriggers(effect, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    await auras.effectCheck(effect);
    await executeMacroPass(effect, 'created');
    if (effect.statuses.has('dead')) await death.executeMacroPass(effect.parent, 'dead');
    if (effect.statuses.size) await effects.specialDurationConditions(effect);
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (effect.parent instanceof Actor) {
        await auras.effectCheck(effect);
        await executeMacroPass(effect, 'deleted');
    }
    await effects.checkInterdependentDeps(effect);
}
let preCreateMacros = [];
let preUpdateMacros = [];
function ready() {
    preCreateMacros = Object.values(macros).filter(i => i.preCreateEffect).flatMap(j => j.preCreateEffect).map(k => k.macro);
    preUpdateMacros = Object.values(macros).filter(i => i.preUpdateEffect).flatMap(j => j.preUpdateEffect).map(k => k.macro);
    preCreateMacros.push(...custom.getCustomMacroList().filter(i => i.preCreateEffect).flatMap(j => j.preCreateEffect).map(k => k.macro));
    preUpdateMacros.push(...custom.getCustomMacroList().filter(i => i.preUpdateEffect).flatMap(j => j.preUpdateEffect).map(k => k.macro));
}
function preCreateActiveEffect(effect, updates, options, userId) {
    if (game.user.id != userId) return;
    if (!(effect.parent instanceof Actor)) return;
    genericUtils.log('dev', 'Executing Effect Macro Pass: preCreate for ' + effect.name);
    preCreateMacros.map(macro => macro(effect, updates, options));
}
function preUpdateActiveEffect(effect, updates, options, userId) {
    if (game.user.id != userId) return;
    if (!(effect.parent instanceof Actor)) return;
    genericUtils.log('dev', 'Executing Effect Macro Pass: preUpdate for ' + effect.name);
    preUpdateMacros.map(macro => macro(effect, updates, options));
}
export let effectEvents = {
    createActiveEffect,
    deleteActiveEffect,
    collectEffectMacros,
    getEffectMacroData,
    ready,
    preCreateActiveEffect,
    preUpdateActiveEffect
};