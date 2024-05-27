import {macros} from '../macros.js';
import {helpers} from '../utilities/genericUtils.js';
function getItemMacroData(item) {
    return item.flags?.['chris-premades']?.macro?.midi?.item ?? [];
}
function getActorMacroData(actor) {
    let items = actor.items.filter(i => i.flags?.['chris-premades']?.macros?.midi?.actor);
    if (!items.length) return [];
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
    if (!macroList.length) return;
    return macroList.map(i => macros[i]).filter(j => j);
}
let macrosMap = {};
export async function preItemRoll(workflow) {
    let macroList = collectMacros(workflow);
    if (!macroList) return;
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let states = Object.keys(MidiQOL.Workflow.allHooks);
    for (let i of states) {
        let itemMacros = macroList.filter(j => j.midi?.item?.find(k => k.pass === i)).map(l => l.midi.item).flat().filter(m => m.pass === i);
        let actorMacros = macroList.filter(j => j.midi?.actor?.find(k => k.pass === i)).map(l => l.midi.actor).flat().filter(m => m.pass === i);
        let stateMacros = itemMacros.concat(actorMacros).sort((a, b) => a.priority - b.priority);
        if (stateMacros.length) foundry.utils.setProperty(macrosMap, id + '.' + i, stateMacros);
    }
    await executeMacroPass(workflow, 'preItemRoll');
}
async function executeMacro(workflow, macro) {
    try {
        await macro(workflow);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.warn(error);
    }
}
async function executeMacroPass(workflow, pass) {
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    console.log(id);
    if (!id) return;
    let passMacros = macrosMap[id]?.[pass];
    console.log(passMacros);
    if (!passMacros) return;
    await helpers.sleep(50);
    for (let i of passMacros) {
        console.log(i);
        await executeMacro(workflow, i.macro);
    }
}
export async function postAttackRollComplete(workflow) {
    await executeMacroPass(workflow, 'postAttackRollComplete');
}
export async function postDamageRoll(workflow) {
    await executeMacroPass(workflow, 'postDamageRoll');
}