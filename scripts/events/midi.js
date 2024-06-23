import * as macros from '../macros.js';
import {conditionResistance} from '../macros/mechanics/conditionResistance.js';
import {conditionVulnerability} from '../macros/mechanics/conditionVulnerability.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../utils.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.midi?.item ?? [];
}
function collectItemMacros(item, pass) {
    let macroList = [];
    macroList.push(...getItemMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j).filter(k => k.midi?.item?.find(l => l.pass === pass)).map(m => m.midi.item).flat().filter(n => n.pass === pass);
}
function getActorMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.midi?.actor ?? [];
}
function collectActorMacros(item, pass) {
    let macroList = [];
    macroList.push(...getActorMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j).filter(k => k.midi?.actor?.find(l => l.pass === pass)).map(m => m.midi.actor).flat().filter(n => n.pass === pass);
}
function collectAllMacros({item, token, actor}, pass) {
    let triggers = [];
    if (item) {
        let macroList = collectItemMacros(item, pass);
        macroList.forEach(i => {
            triggers.push({
                entity: item,
                castData: {
                    castLevel: item.system.level ?? -1,
                    baseLevel: item.system.level ?? -1,
                    saveDC: itemUtils.getSaveDC(item) ?? -1
                },
                macro: i.macro,
                name: item.name,
                priority: i.priority,
                token: token
            });
        });
    }
    if (actor) {
        actor.items.forEach(i => {
            let macroList = collectActorMacros(i, pass);
            macroList.forEach(j => {
                triggers.push({
                    entity: i,
                    castData: {
                        castLevel: i.system.level ?? -1,
                        baseLevel: i.system.level ?? -1,
                        saveDC: itemUtils.getSaveDC(i) ?? -1
                    },
                    macro: j.macro,
                    name: i.name,
                    priority: i.priority,
                    token: token
                });
            });
        });
        actorUtils.getEffects(actor).forEach(i => {
            let macroList = collectActorMacros(i, pass);
            macroList.forEach(j => {
                triggers.push({
                    entity: i,
                    castData: {
                        castLevel: effectUtils.getCastLevel(i) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(i) ?? -1,
                        saveDC: effectUtils.getSaveDC(i) ?? -1
                    },
                    macro: j.macro,
                    name: i.name,
                    priority: i.priority,
                    token: token
                });
            });
        });
    }
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        templates.forEach(i => {
            let macroList = collectActorMacros(i, pass);
            macroList.forEach(j => {
                triggers.push({
                    entity: i,
                    castData: {
                        castLevel: templateUtils.getCastLevel(i) ?? -1,
                        baseLevel: templateUtils.getBaseLevel(i) ?? -1,
                        saveDC: templateUtils.getSaveDC(i) ?? -1
                    },
                    macro: j.macro,
                    name: templateUtils.getName(i),
                    priority: i.priority,
                    token: token
                });
            });
        });
    }
    return triggers;
}
function getSortedTriggers({item, token, actor}, pass) {
    let allTriggers = collectAllMacros({item, token, actor}, pass);
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
async function executeMacro(trigger, workflow, ditem) {
    console.log('CPR: Executing Midi Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    try {
        await trigger.macro({trigger, workflow, ditem});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(workflow, pass) {
    console.log('CPR: Executing Midi Macro Pass: ' + pass + ' for ' + workflow?.item?.name);
    let triggers = getSortedTriggers({item: workflow.item, actor: workflow.actor, token: workflow.token}, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) await executeMacro(trigger, workflow);
}
async function executeTargetMacroPass(workflow) {
    console.log('CPR: Executing Midi Macro Pass: onHit');
    let triggers = [];
    workflow.hitTargets.forEach(i => {
        triggers.push(...getSortedTriggers({token: i, actor: i.actor}, 'onHit'));
    });
    triggers = triggers.sort((a, b) => a.priority - b.priority);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) await executeMacro(trigger, workflow);
}
async function preItemRoll(workflow) {
    await executeMacroPass(workflow, 'preItemRoll');
}
async function postPreambleComplete(workflow) {
    await executeMacroPass(workflow, 'postPreambleComplete');
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.postPreambleComplete(workflow);
        await conditionVulnerability.postPreambleComplete(workflow);
    }
}
async function postAttackRollComplete(workflow) {
    await executeMacroPass(workflow, 'postAttackRollComplete');
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
    await executeTargetMacroPass(workflow);
}
async function preAttackRoll(workflow) {
    await executeMacroPass(workflow, 'preAttackRoll');
}
async function preTargetDamageApplication(token, {workflow, ditem}) {
    console.log('CPR: Executing Midi Macro Pass: applyDamage for ' + token.document.name);
    let triggers = getSortedTriggers({token: token, actor: token.actor}, 'applyDamage');
    triggers = triggers.sort((a, b) => a.priority - b.priority);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) await executeMacro(trigger, workflow, ditem);
}
export let midiEvents = {
    preItemRoll,
    postAttackRollComplete,
    postDamageRoll,
    RollComplete,
    postPreambleComplete,
    preTargetDamageApplication,
    preAttackRoll
};