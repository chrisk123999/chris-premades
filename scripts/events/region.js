import {custom} from './custom.js';
import {genericUtils, macroUtils, regionUtils} from '../utils.js';
function getRegionMacroData(region) {
    return region.flags['chris-premades']?.macros?.region ?? [];
}
function collectMacros(region) {
    let macroList = [];
    macroList.push(...getRegionMacroData(region));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(region))).filter(j => j);
}
function collectRegionsMacros(regions, pass, token) {
    let triggers = [];
    regions.forEach(region => {
        let macroList = collectMacros(region).filter(i => i.region?.find(j => j.pass === pass)).flatMap(k => k.region).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(region, 'region', {pass}));
        if (!macroList.length) return;
        let trigger = {
            entity: region,
            castData: {
                castLevel: regionUtils.getCastLevel(region),
                saveDC: regionUtils.getSaveDC(region)
            },
            macros: macroList,
            name: region.name,
            token: token
        };
        triggers.push(trigger);
    });
    return triggers;
}
function getSortedTriggers(regions, pass, token) {
    let allTriggers = collectRegionsMacros(regions, pass, token);
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
                token: trigger.token,
                macroName: typeof macro.macro === 'string' ? macro.macro : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, options) {
    genericUtils.log('dev', 'Executing Region Macro: ' + trigger.macroName);
    try {
        if (typeof trigger.macro === 'string') {
            await custom.executeScript({script: trigger.macro, trigger, options});
        } else {
            await trigger.macro({trigger, options});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(regions, pass, token, options) {
    genericUtils.log('dev', 'Executing Region Macro Pass: ' + pass);
    let triggers = getSortedTriggers(regions, pass, token);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i, options);
    return triggers.length;
}
export let regionEvents = {
    executeMacroPass,
    collectMacros
};