import * as macros from '../macros.js';
import {actorUtils, genericUtils} from '../utils.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.midi?.item ?? [];
}
function getActorMacroData(actor) {
    let items = actor.items.filter(i => i.flags?.['chris-premades']?.macros?.midi?.actor);
    let effects = actorUtils.getEffects(actor).filter(i => i.flags?.['chris-premades']?.macros?.midi?.actor);
    let combined = items.concat(effects);
    if (!combined.length) return [];
    let macroDatas = [];
    for (let i of items) macroDatas.push(...i.flags['chris-premades'].macros.midi.actor);
    return macroDatas;
}
function collectMacros(workflow) {
    let macroList = [];
    if (workflow.item) macroList.push(...getItemMacroData(workflow.item));
    if (workflow.actor) macroList.push(...getActorMacroData(workflow.actor));
    if (!macroList.length) return;
    return macroList.map(i => macros[i]).filter(j => j);
}
let macrosMap = {};
export async function preItemRoll(workflow) {
    let macroList = collectMacros(workflow);
    if (!macroList) return;
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let states = [
        'preItemRoll',
        'postAttackRollComplete',
        'postDamageRoll',
        'RollComplete'
    ];
    for (let i of states) {
        let itemMacros = macroList.filter(j => j.midi?.item?.find(k => k.pass === i)).map(l => l.midi.item).flat().filter(m => m.pass === i);
        let actorMacros = macroList.filter(j => j.midi?.actor?.find(k => k.pass === i)).map(l => l.midi.actor).flat().filter(m => m.pass === i);
        let stateMacros = itemMacros.concat(actorMacros).sort((a, b) => a.priority - b.priority);
        if (stateMacros.length) foundry.utils.setProperty(macrosMap, id + '.' + i, stateMacros);
    }
    await executeMacroPass(workflow, 'preItemRoll');
}
async function executeMacro(workflow, macro) {
    console.log('CPR: Executing Macro: ' + macro.name);
    try {
        await macro(workflow);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(workflow, pass) {
    console.log('CPR: Executing Macro Pass: ' + pass);
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let passMacros = macrosMap[id]?.[pass];
    if (!passMacros) return;
    await genericUtils.sleep(50);
    for (let i of passMacros) await executeMacro(workflow, i.macro);
}
export async function postAttackRollComplete(workflow) {
    await executeMacroPass(workflow, 'postAttackRollComplete');
}
export async function postDamageRoll(workflow) {
    await executeMacroPass(workflow, 'postDamageRoll');
}
export async function RollComplete(workflow) {
    console.log(workflow);
    await executeMacroPass(workflow, 'RollComplete');
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    delete macrosMap[id];
}