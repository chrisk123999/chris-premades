import {custom} from './custom.js';
import {genericUtils, macroUtils, socketUtils, templateUtils} from '../utils.js';
import {template as templateExtension} from './../extensions/template.js';
function getTemplateMacroData(template) {
    return template.flags?.['chris-premades']?.macros?.template ?? [];
}
function collectMacros(template) {
    let macroList = [];
    macroList.push(...getTemplateMacroData(template));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(template))).filter(j => j);
}
function collectTemplatesMacros(templates, pass) {
    let triggers = [];
    templates.forEach(template => {
        let macroList = collectMacros(template).filter(i => i.template?.find(j => j.pass === pass)).flatMap(k => k.template).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(template, 'template', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: template,
            castData: {
                castLevel: templateUtils.getCastLevel(template) ?? -1,
                saveDC: templateUtils.getSaveDC(template) ?? -1
            },
            macros: macroList,
            name: templateUtils.getName(template).slugify()
        });
    });
    return triggers;
}
function getSortedTriggers(templates, pass, token) {
    let allTriggers = collectTemplatesMacros(templates, pass);
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
                token: token,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, options) {
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded Template Macro: ' + trigger.macroName);
            await custom.executeScript({script: trigger.macro, trigger, options});
        } else {
            genericUtils.log('dev', 'Executing Template Macro: ' + trigger.macroName);
            await trigger.macro({trigger, options});
        }
    } catch (error) {
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
async function updateMeasuredTemplate(template, updates, context, userId) {
    if (!socketUtils.isTheGM()) return;
    let moved = updates.x || updates.y;
    if (!moved) return;
    await executeMacroPass([template], 'moved');
    await templateExtension.templateEffectMoved(template);
}
async function deleteMeasuredTemplate(template) {
    if (!socketUtils.isTheGM() || !template.id) return;
    await executeMacroPass([template], 'deleted');
    await templateExtension.templateEffectDeleted(template);
}
async function createMeasuredTemplate(template) {
    if (!socketUtils.isTheGM()) return;
    await genericUtils.sleep(150);
    await executeMacroPass([template], 'created');
    await templateExtension.templateEffectCreated(template);
}
export let templateEvents = {
    collectMacros,
    executeMacroPass,
    updateMeasuredTemplate,
    deleteMeasuredTemplate,
    createMeasuredTemplate
};