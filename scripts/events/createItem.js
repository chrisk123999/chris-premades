import {genericUtils, socketUtils} from '../utils.js';
import {custom} from './custom.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.createItem ?? [];
}
function collectItemMacros(item, pass) {
    let macroList = [];
    macroList.push(...getItemMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(item))).filter(j => j).filter(k => k.createItem.find(l => l.pass === pass)).flatMap(m => m.createItem).filter(n => n.pass === pass);
}
function collectAllMacros(item, pass) {
    let triggers = [];
    let macroList = collectItemMacros(item, pass);
    if (macroList.length) {
        triggers.push({
            entity: item,
            macros: macroList,
            name: item.name.slugify()
        });
    }
    return triggers;
}
function getSortedTriggers(item, pass) {
    let allTriggers = collectAllMacros(item, pass);
    let sortedTriggers = [];
    let uniqueMacros = new Set();
    allTriggers.forEach(trigger => {
        trigger.macros.forEach(macro => {
            if (macro.unique) {
                if (uniqueMacros.has(macro.unique)) return;
                uniqueMacros.add(macro.unique);
            }
            sortedTriggers.push({
                entity: trigger.entity,
                macro: macro.macro,
                name: trigger.name,
                identifier: genericUtils.getIdentifier(item),
                actor: item.actor
            });
        });
    });
    return sortedTriggers;
}
async function executeMacro(trigger) {
    genericUtils.log('dev', 'Executing Create Item Macro: ' + trigger.macro.name + ' from ' + trigger.name);
    try {
        await trigger.macro({trigger});
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(item, pass) {
    genericUtils.log('dev', 'Executing Create Item Macro Pass: ' + pass + ' for ' + item.name);
    let triggers = getSortedTriggers(item, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) {
        await executeMacro(trigger);
    }
}
async function created(item, updates, options) {
    if (!socketUtils.isTheGM() || !item.actor) return;
    await executeMacroPass(item, 'created');
}
export let itemEvent = {
    created
};