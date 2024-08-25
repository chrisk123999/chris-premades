import {custom} from './custom.js';
import {actorUtils, effectUtils, genericUtils, itemUtils} from '../utils.js';
function getRestMacros(entity) {
    return entity.flags['chris-premades']?.macros?.rest ?? [];
}
function collectRestMacros(entity, pass) {
    let macroList = [];
    macroList.push(...getRestMacros(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i)).filter(j => j).filter(k => k.rest?.find(l => l.pass === pass)).flatMap(m => m.rest).filter(n => n.pass === pass);
}
function collectAllMacros(actor, pass) {
    let triggers = [];
    actor.items.forEach(i => {
        let macroList = collectRestMacros(i, pass);
        if (pass === 'long') macroList.push(...collectRestMacros(i, 'short'));
        macroList.forEach(j => {
            triggers.push({
                entity: i,
                castData: {
                    castLevel: i.system.level ?? -1,
                    baseLevel: i.system.level ?? -1,
                    saveDC: itemUtils.getSaveDC(i) ?? -1
                },
                macro: j.macro,
                name: i.name,
                priority: j.priority,
                custom: i.custom
            });
        });
    });
    actorUtils.getEffects(actor).forEach(i => {
        let macroList = collectRestMacros(i, pass);
        if (pass === 'long') macroList.push(...collectRestMacros(i, 'short'));
        macroList.forEach(j => {
            triggers.push({
                entity: i,
                castData: {
                    castLevel: effectUtils.getCastLevel(i) ?? -1,
                    baseLevel: effectUtils.getBaseLevel(i) ?? -1,
                    saveDC: effectUtils.getSaveDC(i) ?? -1
                },
                macro: j.macro,
                name: i.name,
                priority: j.priority,
                custom: i.custom
            });
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
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, actor) {
    genericUtils.log('dev', 'Executing Rest Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        if (trigger.custom) {
            await custom.runMacro({trigger, actor});
        } else {
            await trigger.macro({trigger, actor});
        }
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
}