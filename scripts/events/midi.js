import {macros} from '../macros.js';
function getItemMacroData(item) {
    return item.flags?.['chris-premades']?.macro?.midi?.item;
}
function getActorMacroData(actor) {
    let items = actor.items.filter(i => i.flags?.['chris-premades']?.macros?.midi?.actor);
    if (!items.length) return;
    let macroDatas = [];
    for (let i of items) {
        macroDatas.push(...i.flags['chris-premades'].macros.midi.actor);
    }
    return macroDatas;
}
function collectMacros(workflow) {
    let macroList = [];
    if (workflow.item) macroList.push(...getItemMacroData(workflow.item));
    if (workflow.actor) macroList.push(...getActorMacroData(workflow.actor));
    console.log(macroList);
    if (!macroList.length) return;
    return macroList.map(i => macros[i]).filter(j => j).sort((a, b) => a.priority - b.priority);
}
let macrosMap = {};
export async function preItemRoll(workflow) {
    let macroList = collectMacros(workflow);
    if (!macroList.length) return;
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    console.log(macroList);
}