import * as macros from '../macros.js';
import {genericUtils, templateUtils} from '../utils.js';
function getTemplateMacroData(template) {
    return template.flags['chris-premades']?.macros?.template ?? [];
}
function collectMacros(template) {
    let macroList = [];
    macroList.push(...getTemplateMacroData(template));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTemplatesMacros(templates, pass) {
    let triggers = [];
    for (let template of templates) {
        let testTemplate;
        if (pass === 'passedThrough') {
            testTemplate = template.template;
        } else {
            testTemplate = template;
        }
        let macroList = collectMacros(testTemplate);
        if (!macroList.length) continue;
        let templateMacros = macroList.filter(i => i.template?.find(j => j.pass === pass)).map(k => k.template).flat().filter(l => l.pass === pass);
        templateMacros.forEach(i => {
            let trigger = {
                entity: template,
                castData: templateUtils.getCastData(template),
                macro: i.macro,
                name: templateUtils.getName(template)
            };
            if (pass === 'passedThrough') trigger.cells = template.cells;
            triggers.push(trigger);
        });
    }
    return triggers;
}
function getSortedTriggers(templates, pass) {
    let allTriggers = collectTemplatesMacros(templates, pass);
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
    console.log('CPR: Executing Template Macro: ' + trigger.macro.name);
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(templates, pass) {
    console.log('CPR: Executing Template Macro Pass: ' + pass);
    let triggers = getSortedTriggers(templates, pass).sort((a, b) => a.priority - b.priority);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
export let templateEvents = {
    collectMacros,
    executeMacroPass
};