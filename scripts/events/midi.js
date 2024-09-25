import {custom} from './custom.js';
import {requirements} from '../extensions/requirements.js';
import {conditionResistance} from '../macros/mechanics/conditionResistance.js';
import {conditionVulnerability} from '../macros/mechanics/conditionVulnerability.js';
import {templateVisibility} from '../macros/mechanics/templateVisibility.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../utils.js';
import {automatedAnimations} from '../integrations/automatedAnimations.js';
import {diceSoNice} from '../integrations/diceSoNice.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.midi?.item ?? [];
}
function collectItemMacros(item, pass) {
    let macroList = [];
    macroList.push(...getItemMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i)).filter(j => j).filter(k => k.midi?.item?.find(l => l.pass === pass)).flatMap(m => m.midi.item).filter(n => n.pass === pass);
}
function getActorMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.midi?.actor ?? [];
}
function collectActorMacros(item, pass) {
    let macroList = [];
    macroList.push(...getActorMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i)).filter(j => j).filter(k => k.midi?.actor?.find(l => l.pass === pass)).flatMap(m => m.midi.actor).filter(n => n.pass === pass);
}
function collectAllMacros({item, token, actor, sourceToken, targetToken}, pass) {
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
                token: token,
                sourceToken: sourceToken,
                custom: i.custom,
                targetToken: targetToken
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
                    priority: j.priority,
                    token: token,
                    sourceToken: sourceToken,
                    custom: i.custom,
                    targetToken: targetToken
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
                    priority: j.priority,
                    token: token,
                    sourceToken: sourceToken,
                    custom: i.custom,
                    targetToken: targetToken
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
                    priority: j.priority,
                    token: token,
                    sourceToken: sourceToken,
                    custom: i.custom,
                    targetToken: targetToken
                });
            });
        });
    }
    return triggers;
}
function getSortedTriggers({item, token, actor, sourceToken, targetToken}, pass) {
    let allTriggers = collectAllMacros({item, token, actor, sourceToken, targetToken}, pass);
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
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, workflow, ditem) {
    genericUtils.log('dev', 'Executing Midi Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    let result;
    try {
        result = await trigger.macro({trigger, workflow, ditem});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
    return result;
}
async function executeMacroPass(workflow, pass) {
    genericUtils.log('dev', 'Executing Midi Macro Pass: ' + pass + ' for ' + workflow?.item?.name);
    let triggers = getSortedTriggers({item: workflow.item, actor: workflow.actor, token: workflow.token}, pass);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) {
        let result = await executeMacro(trigger, workflow);
        if (result) return true;
        if (workflow.aborted) break;
    }
}
async function executeTargetMacroPass(workflow, pass, onlyHit = false) {
    genericUtils.log('dev', 'Executing Midi Macro Pass: ' + pass);
    let triggers = [];
    let targets = onlyHit ? workflow.hitTargets : workflow.targets;
    targets?.filter(i => i).forEach(i => {
        triggers.push(...getSortedTriggers({token: i, actor: i.actor}, pass));
    });
    triggers = triggers.sort((a, b) => a.priority - b.priority);
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) {
        let result = await executeMacro(trigger, workflow);
        if (result) return true;
        if (workflow.aborted) break;
    }
}
async function preTargeting(workflow) {
    let stop = await executeMacroPass(workflow, 'preTargeting');
    if (stop) return false;
}
async function preItemRoll(workflow) {
    let stop = await requirements.versionCheck(workflow);
    if (stop) return true;
    stop = await requirements.automationCheck(workflow);
    if (stop) return true;
    if (genericUtils.getCPRSetting('diceSoNice') && game.modules.get('dice-so-nice')?.active) await diceSoNice.preItemRoll(workflow);
    await genericUtils.sleep(50);
    stop = await executeMacroPass(workflow, 'preItemRoll');
    if (stop) return true;
    stop = await executeTargetMacroPass(workflow, 'targetPreItemRoll');
    if (stop) return true;
    if (workflow.actor.items.get(workflow.item.id) && game.modules.get('autoanimations')?.active) await automatedAnimations.disableAnimation(workflow);
}
async function preambleComplete(workflow) {
    await executeMacroPass(workflow, 'preambleComplete');
    await executeTargetMacroPass(workflow, 'targetPreambleComplete');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'scenePreambleComplete'));
    });
    sceneTriggers = sceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: scenePreambleComplete');
    for (let trigger of sceneTriggers) await executeMacro(trigger, workflow);
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.preambleComplete(workflow);
        await conditionVulnerability.preambleComplete(workflow);
    }
    await templateVisibility.check(workflow);
}
async function attackRollComplete(workflow) {
    await executeMacroPass(workflow, 'attackRollComplete');
    await executeTargetMacroPass(workflow, 'targetAttackRollComplete');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'sceneAttackRollComplete'));
    });
    sceneTriggers = sceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: sceneAttackRollComplete');
    for (let trigger of sceneTriggers) {
        await executeMacro(trigger, workflow);
        if (workflow.aborted) break;
    }
    if (genericUtils.getCPRSetting('automatedAnimationSounds') && workflow.item) automatedAnimations.aaSound(workflow.item, 'attack');
}
async function damageRollComplete(workflow) {
    await executeMacroPass(workflow, 'damageRollComplete');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'sceneDamageRollComplete'));
    });
    sceneTriggers = sceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: sceneDamageRollComplete');
    for (let trigger of sceneTriggers) await executeMacro(trigger, workflow);
    if (genericUtils.getCPRSetting('automatedAnimationSounds') && workflow.item) automatedAnimations.aaSound(workflow.item, 'damage');
    if (genericUtils.getCPRSetting('diceSoNice') && game.modules.get('dice-so-nice')?.active) diceSoNice.damageRollComplete(workflow);
}
async function rollFinished(workflow) {
    if (genericUtils.getCPRSetting('devTools')) console.log(workflow);
    await executeMacroPass(workflow, 'rollFinished');
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.RollComplete(workflow);
        await conditionVulnerability.RollComplete(workflow);
    }
    await executeTargetMacroPass(workflow, 'onHit', true);
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'sceneRollFinished'));
    });
    sceneTriggers = sceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: sceneRollFinished');
    for (let trigger of sceneTriggers) await executeMacro(trigger, workflow);
    
    if (genericUtils.getCPRSetting('automatedAnimationSounds') && workflow.item) automatedAnimations.aaSound(workflow.item, 'done');
}
async function postAttackRoll(workflow) {
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'scenePostAttackRoll'));
    });
    sceneTriggers = sceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: scenePostAttackRoll');
    for (let trigger of sceneTriggers) await executeMacro(trigger, workflow);
    await executeMacroPass(workflow, 'postAttackRoll');
    await executeTargetMacroPass(workflow, 'targetPostAttackRoll');
}
async function preTargetDamageApplication(token, {workflow, ditem}) {
    genericUtils.log('dev', 'Executing Midi Macro Pass: applyDamage for ' + token.document.name);
    let targetTriggers = getSortedTriggers({token: token, actor: token.actor}, 'targetApplyDamage');
    let selfTriggers = getSortedTriggers({item: workflow.item, token: workflow.token, actor: workflow.actor}, 'applyDamage');
    let sceneTriggers = [];
    token.document.parent.tokens.filter(i => i.uuid != token.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token, targetToken: token}, 'sceneApplyDamage'));
    });
    let triggers = [...targetTriggers, ...selfTriggers, ...sceneTriggers].sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: applyDamage, targetApplyDamage, sceneApplyDamage');
    for (let trigger of triggers) await executeMacro(trigger, workflow, ditem);
}
export let midiEvents = {
    preTargeting,
    preItemRoll,
    attackRollComplete,
    damageRollComplete,
    rollFinished,
    preambleComplete,
    preTargetDamageApplication,
    postAttackRoll
};