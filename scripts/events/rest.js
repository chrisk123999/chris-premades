import {custom} from './custom.js';
import {actorUtils, effectUtils, genericUtils, itemUtils} from '../utils.js';
import {bg3} from '../macros/2014/homebrew/bg3WeaponActions.js';
function getRestMacros(entity) {
    return entity.flags['chris-premades']?.macros?.rest ?? [];
}
function collectRestMacros(entity, pass) {
    let macroList = [];
    macroList.push(...getRestMacros(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j).filter(k => k.rest?.find(l => l.pass === pass)).flatMap(m => m.rest).filter(n => n.pass === pass);
}
function collectAllMacros(actor, pass) {
    let triggers = [];
    actor.items.forEach(item => {
        let macroList = collectRestMacros(item, pass);
        if (pass === 'long') macroList.push(...collectRestMacros(item, 'short'));
        if (!macroList.length) return;
        triggers.push({
            entity: item,
            castData: {
                castLevel: item.system.level ?? -1,
                baseLevel: item.system.level ?? -1,
                saveDC: itemUtils.getSaveDC(item) ?? -1
            },
            macros: macroList,
            name: item.name.slugify()
        });
    });
    actorUtils.getEffects(actor).forEach(effect => {
        let macroList = collectRestMacros(effect, pass);
        if (pass === 'long') macroList.push(...collectRestMacros(effect, 'short'));
        if (!macroList.length) return;
        triggers.push({
            entity: effect,
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            },
            macros: macroList,
            name: effect.name.slugify()
        });
    });
    return triggers;
}
function getSortedTriggers(actor, pass) {
    let allTriggers = collectAllMacros(actor, pass);
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
                name: trigger.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, actor) {
    genericUtils.log('dev', 'Executing Rest Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        await trigger.macro({trigger, actor});
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(actor, pass) {
    genericUtils.log('dev', 'Executing Rest Macro Pass: ' + pass + ' for ' + actor.name);
    let triggers = getSortedTriggers(actor, pass);
    for (let trigger of triggers) {
        await executeMacro(trigger, actor);
    }
}
export async function rest(actor, data) {
    let pass = data.longRest ? 'long' : 'short';
    await executeMacroPass(actor, pass);
    if (genericUtils.getCPRSetting('bg3WeaponActionsEnabled')) await bg3.rest(actor);
}