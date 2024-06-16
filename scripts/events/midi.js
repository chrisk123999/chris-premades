import * as macros from '../macros.js';
import {conditionResistance} from '../macros/mechanics/conditionResistance.js';
import {conditionVulnerability} from '../macros/mechanics/conditionVulnerability.js';
import {actorUtils, effectUtils, genericUtils, templateUtils} from '../utils.js';
import {combatEvents} from './combat.js';
import {templateEvents} from './template.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.midi?.item ?? [];
}
function getActorMacroData(actor) {
    let items = actor.items.filter(i => i.flags?.['chris-premades']?.macros?.midi?.actor);
    let effects = actorUtils.getEffects(actor).filter(i => i.flags?.['chris-premades']?.macros?.midi?.actor);
    let combined = items.concat(effects);
    if (!combined.length) return [];
    let macroDatas = [];
    for (let i of combined) macroDatas.push(...i.flags['chris-premades'].macros.midi.actor);
    return macroDatas;
}
function collectMacros(workflow) {
    let macroList = [];
    if (workflow.item) macroList.push(...getItemMacroData(workflow.item));
    if (workflow.actor) macroList.push(...getActorMacroData(workflow.actor));
    if (!macroList.length) return;
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTargetTokenMacros(token, pass) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor);
        for (let effect of effects) {
            let macroList = combatEvents.collectMacros(effect);
            if (!macroList.length) continue;
            let effectMacros = macroList.filter(i => i.effect?.find(j => j.pass === pass)).map(k => k.effect).flat().filter(l => l.pass === pass);
            effectMacros.forEach(i => {
                triggers.push({
                    entity: effect,
                    castData: {
                        castLevel: effectUtils.getCastLevel(effect) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                        saveDC: effectUtils.getSaveDC(effect) ?? -1
                    },
                    macro: i.macro,
                    name: effect.name,
                    token: token
                });
            });
        }
        for (let item of token.actor.items) {
            let macroList = combatEvents.collectMacros(item);
            if (!macroList.length) continue;
            let itemMacros = macroList.filter(i => i.midi?.item?.find(j => j.pass === pass)).map(k => k.midi.item).flat().filter(l => l.pass === pass);
            itemMacros.forEach(i => {
                triggers.push({
                    entity: item,
                    castData: {
                        castLevel: -1,
                        saveDC: -1
                    },
                    macro: i.macro,
                    name: item.name,
                    token: token
                });
            });
        }
    }
    let templates = templateUtils.getTemplatesInToken(token);
    for (let template of templates) {
        let macroList = templateEvents.collectMacros(template);
        if (!macroList.length) continue;
        let templateMacros = macroList.filter(i => i.template?.find(j => j.pass === pass)).map(k => k.template).flat().filter(l => l.pass === pass);
        templateMacros.forEach(i => {
            triggers.push({
                entity: template,
                castData: {
                    castLevel: templateUtils.getCastLevel(template) ?? -1,
                    saveDC: templateUtils.getSaveDC(template) ?? -1
                },
                macro: i.macro,
                name: templateUtils.getName(template),
                token: token
            });
        });
    }
    return triggers;
}
function getTargetSortedTriggers(token, pass) {
    let allTriggers = collectTargetTokenMacros(token, pass);
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
function collectTargetMacros(workflow, pass) {
    let targetMacrosList = [];
    workflow.hitTargets.forEach(token => {
        targetMacrosList.push(...getTargetSortedTriggers(token, pass));
    });
    if (!targetMacrosList.length) return;
    return targetMacrosList;
}
let macrosMap = {};
async function executeTargetMacro(trigger) {
    console.log('CPR: Executing Midi Target Macro: ' + trigger.macro.name);
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeTargetMacroPass(workflow, pass) {
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let triggers = macrosMap[id]?.[pass];
    if (!triggers) return;
    for (let trigger of triggers) {
        console.log('CPR: Executing Midi Target Macro Pass: ' + pass + ' for ' + trigger.token.name);
        trigger.workflow = workflow;
        await executeTargetMacro(trigger);
    }
}
async function executeMacro(workflow, macro) {
    console.log('CPR: Executing Midi Macro: ' + macro.name);
    try {
        await macro(workflow);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(workflow, pass) {
    console.log('CPR: Executing Midi Macro Pass: ' + pass);
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let passMacros = macrosMap[id]?.[pass];
    if (!passMacros) return;
    await genericUtils.sleep(50);
    for (let i of passMacros) await executeMacro(workflow, i.macro);
}
async function preItemRoll(workflow) {
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
        if (stateMacros.length) genericUtils.setProperty(macrosMap, id + '.' + i, stateMacros);
    }
    await executeMacroPass(workflow, 'preItemRoll');
}
async function postPreambleComplete(workflow) {
    await executeMacroPass(workflow, 'postPreambleComplete');
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.postPreambleComplete(workflow);
        await conditionVulnerability.postPreambleComplete(workflow);
    }
    await executeMacroPass(workflow, 'preItemRoll');
}
async function postAttackRollComplete(workflow) {
    await executeMacroPass(workflow, 'postAttackRollComplete');
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let targetMacroList = collectTargetMacros(workflow, 'onHit');
    if (targetMacroList) genericUtils.setProperty(macrosMap, id + '.onHit', targetMacroList);
    let damagedMacroList = collectTargetMacros(workflow, 'damaged');
    if (damagedMacroList) genericUtils.setProperty(macrosMap, id + '.damaged', targetMacroList);
}
async function postDamageRoll(workflow) {
    await executeMacroPass(workflow, 'postDamageRoll');
}
async function RollComplete(workflow) {
    console.log(workflow);
    await executeMacroPass(workflow, 'RollComplete');
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.RollComplete(workflow);
        await conditionVulnerability.RollComplete(workflow);
    }
    await executeTargetMacroPass(workflow, 'onHit');
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    delete macrosMap[id];
}
async function preTargetDamageApplication(token, {workflow, ditem}) {
    let id = workflow.item?.id ?? workflow?.item?.flags?.['chris-premades']?.macros?.id;
    if (!id) return;
    let damageTriggers = macrosMap[id]?.damaged;
    if (!damageTriggers) return;
    let triggers = damageTriggers.filter(i => i.token === token);
    //Finish This!

}
export let midiEvents = {
    preItemRoll,
    postAttackRollComplete,
    postDamageRoll,
    RollComplete,
    postPreambleComplete,
    preTargetDamageApplication
};