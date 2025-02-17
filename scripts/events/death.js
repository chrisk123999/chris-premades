import {actorUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../utils.js';
import {custom} from './custom.js';
function getDeathMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.death ?? [];
}
function collectDeathMacros(entity, pass) {
    let macroList = [];
    macroList.push(...getDeathMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j).filter(k => k.death?.find(l => l.pass === pass)).flatMap(m => m.death).filter(n => n.pass === pass);
}
function collectAllMacros({actor}, pass) {
    let triggers = [];
    let token = actorUtils.getFirstToken(actor);
    actor.items.forEach(item => {
        let macroList = collectDeathMacros(item, pass);
        if (!macroList.length) return;
        triggers.push({
            entity: item,
            castData: {
                castLevel: item.system.level ?? -1,
                baseLevel: item.system.level ?? -1,
                saveDC: itemUtils.getSaveDC(item) ?? -1
            },
            macros: macroList,
            name: item.name.slugify(),
            token: token,
            actor: actor
        });
    });
    actorUtils.getEffects(actor).forEach(effect => {
        let macroList = collectDeathMacros(effect, pass);
        if (!macroList.length) return;
        triggers.push({
            entity: effect,
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            },
            macros: macroList,
            name: effect.name.slugify(),
            token: token,
            actor: actor
        });
    });
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        templates.forEach(template => {
            let macroList = collectDeathMacros(template, pass);
            if (!macroList.length) return;
            triggers.push({
                entity: template,
                castData: {
                    castLevel: templateUtils.getCastLevel(template) ?? -1,
                    baseLevel: templateUtils.getBaseLevel(template) ?? -1,
                    saveDC: templateUtils.getSaveDC(template) ?? -1
                },
                macros: macroList,
                name: templateUtils.getName(template).slugify(),
                token: token,
                actor: actor
            });
        });
    }
    return triggers;
}
function getSortedTriggers({actor}, pass) {
    let allTriggers = collectAllMacros({actor}, pass);
    let names = new Set(allTriggers.map(i => i.name));
    allTriggers = Object.fromEntries(names.map(i => [i, allTriggers.filter(j => j.name === i)]));
    let maxMap = {};
    names.forEach(i => {
        let maxLevel = Math.max(...allTriggers[i].map(j => j.castData.castLevel));
        let maxDC = Math.max(...allTriggers[i].map(j => j.castData.saveDC));
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
                castData: trigger.castData,
                entity: trigger.entity,
                macro: macro.macro,
                priority: macro.priority,
                name: trigger.name,
                token: trigger.token,
                actor: trigger.actor
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    genericUtils.log('dev', 'Executing Death Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        await trigger.macro({trigger});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(actor, pass) {
    genericUtils.log('dev', 'Executing Death Macro Pass: ' + pass + ' for ' + actor.name);
    let triggers = getSortedTriggers({actor}, pass);
    for (let trigger of triggers) await executeMacro(trigger);
}
export let death = {
    executeMacroPass
};