import * as macros from '../macros.js';
import {genericUtils, socketUtils, templateUtils} from '../utils.js';
function getTemplateMacroData(template) {
    return template.flags['chris-premades']?.macros?.template ?? [];
}
function collectMacros(template) {
    let macroList = [];
    macroList.push(...getTemplateMacroData(template));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTemplatesMacros(templates, pass, token) {
    let triggers = [];
    for (let template of templates) {
        let macroList = collectMacros(template);
        if (!macroList.length) continue;
        let templateMacros = macroList.filter(i => i.template?.find(j => j.pass === pass)).flatMap(k => k.template).filter(l => l.pass === pass);
        templateMacros.forEach(i => {
            let trigger = {
                entity: template,
                castData: templateUtils.getCastData(template),
                macro: i.macro,
                name: templateUtils.getName(template),
                priority: i.priority,
                token: token
            };
            triggers.push(trigger);
        });
    }
    return triggers;
}
function getSortedTriggers(templates, pass, token) {
    let allTriggers = collectTemplatesMacros(templates, pass, token);
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
async function executeMacro(trigger, options) {
    genericUtils.log('dev', 'Executing Template Macro: ' + trigger.macro.name);
    try {
        await trigger.macro({trigger, options});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(templates, pass, token, options) {
    genericUtils.log('dev', 'Executing Template Macro Pass: ' + pass);
    let triggers = getSortedTriggers(templates, pass, token);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i, options);
}
/*function preUpdateTemplate(template, updates, context, userId) {
    if (!socketUtils.isTheGM()) return;
    genericUtils.setProperty(context, 'chris-premades.coords.previous', {x: template.x, y: template.y});
}*/
async function updateMeasuredTemplate(template, updates, context, userId) {
    if (!socketUtils.isTheGM()) return;
    let moved = updates.x || updates.y;
    if (!moved) return;
    //let previous = context?.['chris-premades']?.coords?.previous;
    //let current = {x: template.x, y: template.y};
    await executeMacroPass([template], 'moved');
}
export let templateEvents = {
    collectMacros,
    executeMacroPass,
    updateMeasuredTemplate
};