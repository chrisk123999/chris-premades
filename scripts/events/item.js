import {actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, regionUtils, socketUtils, templateUtils} from '../utils.js';
import {custom} from './custom.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.item ?? [];
}
function collectItemMacros(item, pass) {
    let macroList = [];
    macroList.push(...getItemMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(item))).filter(j => j).filter(k => k.item?.find(l => l.pass === pass)).flatMap(m => m.item).filter(n => n.pass === pass);
}
function collectAllMacros(item, pass) {
    let triggers = [];
    let token = actorUtils.getFirstToken(item.actor);
    let simplePasses = ['created', 'deleted', 'equipped', 'unequipped'];
    if (simplePasses.includes(pass)) {
        let macroList = collectItemMacros(item, pass);
        if (macroList.length) {
            triggers.push({
                entity: item,
                castData: {
                    castLevel: item.system.level ?? -1,
                    baseLevel: item.system.level ?? -1,
                    saveDC: itemUtils.getSaveDC(item) ?? -1
                },
                macros: macroList,
                name: item.name.slugify(),
                token,
                actor: item.actor
            });
        }
        let embeddedMacros = macroUtils.getEmbeddedMacros(item, 'item', {pass});
        if (embeddedMacros.length) {
            triggers.push({
                entity: item,
                castData: {
                    castLevel: item.system.level ?? -1,
                    baseLevel: item.system.level ?? -1,
                    saveDC: itemUtils.getSaveDC(item) ?? -1
                },
                macros: embeddedMacros,
                name: item.name.slugify(),
                token,
                actor: item.actor
            });
        }
        return triggers;
    }
    item.actor.items.forEach(aItem => {
        let macroList = collectItemMacros(aItem, pass).concat(macroUtils.getEmbeddedMacros(aItem, 'item', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: aItem,
            castData: {
                castLevel: aItem.system.level ?? -1,
                baseLevel: aItem.system.level ?? -1,
                saveDC: itemUtils.getSaveDC(aItem) ?? -1
            },
            macros: macroList,
            name: aItem.name.slugify(),
            token,
            actor: item.actor
        });
    });
    actorUtils.getEffects(item.actor, {includeItemEffects: true}).forEach(effect => {
        let macroList = collectItemMacros(effect, pass).concat(macroUtils.getEmbeddedMacros(effect, 'item', {pass}));
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
            token,
            actor: item.actor
        });
    });
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        templates.forEach(template => {
            let macroList = collectItemMacros(template, pass).concat(macroUtils.getEmbeddedMacros(template, 'item', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: template,
                castData: {
                    castLevel: templateUtils.getCastLevel(template) ?? -1,
                    baseLevel: templateUtils.getBaseLevel(template) ?? -1,
                    saveDC: templateUtils.getSaveDC(template) ?? -1
                },
                macros: macroList,
                name: actorUtils.getName(template).slugify(),
                token,
                actor: item.actor
            });
        });
        token.document.regions.forEach(region => {
            let macroList = collectItemMacros(region, pass).concat(macroUtils.getEmbeddedMacros(region, 'item', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: region,
                castData: {
                    castLevel: regionUtils.getCastLevel(region) ?? -1,
                    baseLevel: regionUtils.getBaseLevel(region) ?? -1,
                    saveDC: regionUtils.getSaveDC(region) ?? -1
                },
                macros: macroList,
                name: actorUtils.getName(region).slugify(),
                token,
                actor: item.actor
            });
        });
    }
    return triggers;
}
function getSortedTriggers(item, pass) {
    let allTriggers = collectAllMacros(item, pass);
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
                actor: trigger.actor,
                macroName: typeof macro.macro === 'string' ? macro.macro : macro.macro.name,
                item
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    try {
        if (typeof trigger.macro === 'string') {   
            genericUtils.log('dev', 'Executing Embedded Item Macro: ' + trigger.macroName + ' from ' + trigger.name);         
            await custom.executeScript({script: trigger.macro, trigger});
        } else {
            genericUtils.log('dev', 'Executing Item Macro: ' + trigger.macroName + ' from ' + trigger.name);
            await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(item, pass) {
    genericUtils.log('dev', 'Executing Item Macro Pass: ' + pass + ' for ' + item.name);
    let triggers = getSortedTriggers(item, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) {
        await executeMacro(trigger);
    }
}
async function created(item, updates, options) {
    if (!socketUtils.isTheGM() || !item.actor) return;
    await executeMacroPass(item, 'created');
    await executeMacroPass(item, 'actorCreated');
}
async function deleted(item, options, userId) {
    if (!socketUtils.isTheGM() || !item.actor) return;
    await executeMacroPass(item, 'deleted');
    await executeMacroPass(item, 'actorDeleted');
}
export let itemEvent = {
    created,
    deleted,
    executeMacroPass
};