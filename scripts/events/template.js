import {custom} from './custom.js';
import {genericUtils, socketUtils, templateUtils} from '../utils.js';
function getTemplateMacroData(template) {
    return template.flags['chris-premades']?.macros?.template ?? [];
}
function collectMacros(template) {
    let macroList = [];
    macroList.push(...getTemplateMacroData(template));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(template))).filter(j => j);
}
function collectTemplatesMacros(templates, pass, token) {
    let triggers = [];
    templates.forEach(template => {
        let macroList = collectMacros(template);
        if (!macroList.length) return;
        let templateMacros = macroList.filter(i => i.template?.find(j => j.pass === pass)).flatMap(k => k.template).filter(l => l.pass === pass);
        if (!templateMacros.length) return;
        let trigger = {
            entity: template,
            castData: {
                castLevel: templateUtils.getCastLevel(template),
                saveDC: templateUtils.getSaveDC(template)
            },
            macros: templateMacros,
            name: templateUtils.getName(template).slugify(),
            token: token
        };
        triggers.push(trigger);
    });
    return triggers;
}
function getSortedTriggers(templates, pass, token) {
    let allTriggers = collectTemplatesMacros(templates, pass, token);
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
                token: trigger.token
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
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
    return triggers.length;
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