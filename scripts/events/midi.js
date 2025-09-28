import {custom} from './custom.js';
import {requirements} from '../extensions/requirements.js';
import {conditionResistance} from '../macros/mechanics/conditionResistance.js';
import {conditionVulnerability} from '../macros/mechanics/conditionVulnerability.js';
import {templateVisibility} from '../macros/mechanics/templateVisibility.js';
import {activityUtils, actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, regionUtils, rollUtils, socketUtils, templateUtils} from '../utils.js';
import {diceSoNice} from '../integrations/diceSoNice.js';
import {cleave} from '../macros/mechanics/cleave.js';
import {critFumble} from '../macros/homebrew/critFumble.js';
import {explodingHeals} from '../macros/homebrew/explodingHeals.js';
import {CPRMultipleRollResolver} from '../applications/rollResolverMultiple.js';
import {masteries} from '../macros/2024/mechanics/masteries.js';
import {effects} from '../extensions/effects.js';
function getItemMacroData(item) {
    return item.flags['chris-premades']?.macros?.midi?.item ?? [];
}
function collectItemMacros(item, pass, activityIdentifier) {
    let macroList = [];
    macroList.push(...getItemMacroData(item));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(item))).filter(j => j).filter(k => k.midi?.item?.find(l => l.pass === pass)).flatMap(m => m.midi.item).filter(n => n.pass === pass && (!n.activities?.length || n.activities.includes(activityIdentifier)));
}
function getActorMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.midi?.actor ?? [];
}
function collectActorMacros(entity, pass) {
    let macroList = [];
    macroList.push(...getActorMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j).filter(k => k.midi?.actor?.find(l => l.pass === pass)).flatMap(m => m.midi.actor).filter(n => n.pass === pass);
}
function collectAllMacros({activity, item, token, actor}, pass) {
    let triggers = [];
    if (item) {
        let macroList = collectItemMacros(item, pass, activityUtils.getIdentifier(activity)).concat(macroUtils.getEmbeddedMacros(item, 'midi.item', {pass}));
        if (activity) macroList = macroList.concat(macroUtils.getEmbeddedMacros(activity, 'midi.item', {pass}));
        if (macroList.length) triggers.push({
            entity: item,
            castData: {
                castLevel: item.system.level ?? -1,
                baseLevel: item.system.level ?? -1,
                saveDC: itemUtils.getSaveDC(item) ?? -1
            },
            macros: macroList,
            name: item.name.slugify(),
            token
        });
    }
    if (actor) {
        actor.items.forEach(i => {
            let macroList = collectActorMacros(i, pass).concat(macroUtils.getEmbeddedMacros(i, 'midi.actor', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: i,
                castData: {
                    castLevel: i.system.level ?? -1,
                    baseLevel: i.system.level ?? -1,
                    saveDC: itemUtils.getSaveDC(i) ?? -1
                },
                macros: macroList,
                name: i.name.slugify(),
                token: token
            });
        });
        actorUtils.getEffects(actor, {includeItemEffects: true}).forEach(i => {
            let macroList = collectActorMacros(i, pass).concat(macroUtils.getEmbeddedMacros(i, 'midi.actor', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: i,
                castData: {
                    castLevel: effectUtils.getCastLevel(i) ?? -1,
                    baseLevel: effectUtils.getBaseLevel(i) ?? -1,
                    saveDC: effectUtils.getSaveDC(i) ?? -1
                },
                macros: macroList,
                name: i.name.slugify(),
                token: token
            });
        });
    }
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        templates.forEach(i => {
            let macroList = collectActorMacros(i, pass).concat(macroUtils.getEmbeddedMacros(i, 'midi.actor', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: i,
                castData: {
                    castLevel: templateUtils.getCastLevel(i) ?? -1,
                    baseLevel: templateUtils.getBaseLevel(i) ?? -1,
                    saveDC: templateUtils.getSaveDC(i) ?? -1
                },
                macros: macroList,
                name: templateUtils.getName(i).slugify(),
                token: token
            });
        });
        token.document.regions.forEach(i => {
            let macroList = collectActorMacros(i, pass).concat(macroUtils.getEmbeddedMacros(i, 'midi.actor', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: i,
                castData: {
                    castLevel: regionUtils.getCastLevel(i) ?? -1,
                    baseLevel: regionUtils.getBaseLevel(i) ?? -1,
                    saveDC: regionUtils.getSaveDC(i) ?? -1
                },
                macros: macroList,
                name: i.name.slugify(),
                token: token
            });
        });
    }
    return triggers;
}
function getSortedTriggers({activity, item, token, actor, sourceToken, targetToken}, pass) {
    let allTriggers = collectAllMacros({activity, item, token, actor, sourceToken, targetToken}, pass);
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
    let uniqueMacros = new Set();
    triggers.forEach(trigger => {
        trigger.macros.forEach(macro => {
            if (macro.unique) {
                if (uniqueMacros.has(macro.unique)) return;
                uniqueMacros.add(macro.unique);
            }
            sortedTriggers.push({
                castData: trigger.castData,
                entity: trigger.entity,
                macro: macro.macro,
                priority: macro.priority,
                name: trigger.name,
                sourceToken,
                targetToken,
                token,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, workflow, ditem) {
    let result;
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded Midi Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await custom.executeScript({script: trigger.macro, trigger, workflow, ditem});
        } else {
            genericUtils.log('dev', 'Executing Midi Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await trigger.macro({trigger, workflow, ditem});
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}
async function executeMacroPass(workflow, pass) {
    genericUtils.log('dev', 'Executing Midi Macro Pass: ' + pass + ' for ' + workflow?.item?.name);
    let triggers = getSortedTriggers({activity: workflow.activity, item: workflow.item, actor: workflow.actor, token: workflow.token}, pass);
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
async function preTargeting({activity, token, config, dialog, message}) {
    genericUtils.log('dev', 'Executing Midi Macro Pass: preTargeting for ' + activity?.item?.name);
    if (!token) token = actorUtils.getFirstToken(activity.actor);
    let triggers = getSortedTriggers({activity, item: activity.item, actor: activity.actor, token}, 'preTargeting');
    if (triggers.length) await genericUtils.sleep(50);
    for (let trigger of triggers) {
        genericUtils.log('dev', 'Executing Midi Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
        let result;
        try {
            result = await trigger.macro({trigger, activity, token, actor: token.actor, config, dialog, message});
        } catch (error) {
            console.error(error);
        }
        if (result) return false;
    }
}
async function preItemRoll(workflow) {
    let stop = await requirements.ruleCheck(workflow);
    if (stop) return false;
    stop = await requirements.versionCheck(workflow);
    if (stop) return false;
    stop = await requirements.automationCheck(workflow);
    if (stop) return false;
    if (workflow.item) {
        stop = await requirements.scaleCheck(workflow.item);
        if (stop) return false;
    }
    if (genericUtils.getCPRSetting('diceSoNice') && game.modules.get('dice-so-nice')?.active) await diceSoNice.preItemRoll(workflow);
    await genericUtils.sleep(50);
    stop = await executeMacroPass(workflow, 'preItemRoll');
    if (stop) return false;
    stop = await executeTargetMacroPass(workflow, 'targetPreItemRoll');
    if (stop) return false;
}
async function preambleComplete(workflow) {
    await executeMacroPass(workflow, 'preambleComplete');
    await executeTargetMacroPass(workflow, 'targetPreambleComplete');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'scenePreambleComplete'));
    });
    let sortedSceneTriggers = [];
    let names = new Set();
    sceneTriggers.forEach(i => {
        if (names.has(i.name)) return;
        sortedSceneTriggers.push(i);
        names.add(i.name);
    });
    sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: scenePreambleComplete');
    for (let trigger of sortedSceneTriggers) await executeMacro(trigger, workflow);
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.preambleComplete(workflow);
        await conditionVulnerability.preambleComplete(workflow);
    }
    await templateVisibility.check(workflow);
    //TODO: Region Visibility Check Here!
}
async function attackRollComplete(workflow) {
    await executeMacroPass(workflow, 'attackRollComplete');
    await executeTargetMacroPass(workflow, 'targetAttackRollComplete');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'sceneAttackRollComplete'));
    });
    let sortedSceneTriggers = [];
    let names = new Set();
    sceneTriggers.forEach(i => {
        if (names.has(i.name)) return;
        sortedSceneTriggers.push(i);
        names.add(i.name);
    });
    sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: sceneAttackRollComplete');
    for (let trigger of sortedSceneTriggers) {
        await executeMacro(trigger, workflow);
        if (workflow.aborted) break;
    }
    if (genericUtils.getCPRSetting('criticalFumbleMode')) await critFumble.attack(workflow);
}
async function savesComplete(workflow) {
    await executeMacroPass(workflow, 'savesComplete');
    await executeTargetMacroPass(workflow, 'targetSavesComplete');
}
async function damageRollComplete(workflow) {
    await executeMacroPass(workflow, 'damageRollComplete');
    await executeTargetMacroPass(workflow, 'targetDamageRollComplete');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'sceneDamageRollComplete'));
    });
    let sortedSceneTriggers = [];
    let names = new Set();
    sceneTriggers.forEach(i => {
        if (names.has(i.name)) return;
        sortedSceneTriggers.push(i);
        names.add(i.name);
    });
    sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: sceneDamageRollComplete');
    for (let trigger of sortedSceneTriggers) await executeMacro(trigger, workflow);
    if (genericUtils.getCPRSetting('diceSoNice') && game.modules.get('dice-so-nice')?.active) await diceSoNice.damageRollComplete(workflow);
    if (genericUtils.getCPRSetting('explodingHeals')) await explodingHeals(workflow);
    let manualRollsEnabled = genericUtils.getCPRSetting('manualRollsEnabled');
    if (manualRollsEnabled && (workflow.hitTargets?.size === 0 ? genericUtils.getCPRSetting('manualRollsPromptOnMiss') : true)) await _manualRollsNewRolls(workflow);
}
async function _manualRollsNewRolls(workflow) {
    genericUtils.log('dev', 'New Rolls for Midi Workflow');
    if (!genericUtils.getCPRSetting('manualRollsUsers')?.[game.user.id]) return false;
    let manualRollsInclusion = genericUtils.getCPRSetting('manualRollsInclusion');
    if (manualRollsInclusion === 0) return false;
    else if (manualRollsInclusion === 1) '';
    else if ((manualRollsInclusion === 2) && (workflow.actor.type != 'character')) return false;
    else if ((manualRollsInclusion === 3) && (workflow.actor?.prototypeToken?.actorLink != true)) return false;
    else if ((manualRollsInclusion === 4) && ((workflow.actor?.prototypeToken?.actorLink != true) || (genericUtils.checkPlayerOwnership(workflow.actor) != true))) return false;
    else if ((manualRollsInclusion === 5) && (genericUtils.checkPlayerOwnership(workflow.actor) != true)) return false;
    let newRolls = workflow.damageRolls.map(roll => new CONFIG.Dice.DamageRoll(roll.formula, roll.data, roll.options));
    let gmID = socketUtils.gmID();
    if (genericUtils.getCPRSetting('manualRollsGMFulfils') && game.user.id != gmID && game.users.get(gmID)?.active) {
        newRolls = await rollUtils.remoteDamageRolls(newRolls, gmID);
    } else {
        let resolver = new CPRMultipleRollResolver(newRolls);
        await resolver.awaitFulfillment();
        newRolls.forEach(async roll => {
            const ast = CONFIG.Dice.parser.toAST(roll.terms);
            roll._total = await roll._evaluateASTAsync(ast);
        });
        resolver.close();
    }
    await workflow.setDamageRolls(newRolls);
}
async function rollFinished(workflow) {
    await executeMacroPass(workflow, 'rollFinished');
    await executeTargetMacroPass(workflow, 'targetRollFinished');
    await executeTargetMacroPass(workflow, 'onHit', true);
    //await executeMacroPass(workflow, 'rollFinishedLate');
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'sceneRollFinished'));
    });
    let sortedSceneTriggers = [];
    let names = new Set();
    sceneTriggers.forEach(i => {
        if (names.has(i.name)) return;
        sortedSceneTriggers.push(i);
        names.add(i.name);
    });
    sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: sceneRollFinished');
    for (let trigger of sortedSceneTriggers) await executeMacro(trigger, workflow);
    if (genericUtils.getCPRSetting('conditionResistanceAndVulnerability')) {
        await conditionResistance.RollComplete(workflow);
        await conditionVulnerability.RollComplete(workflow);
    }
    if (genericUtils.getCPRSetting('weaponMastery')) await masteries.RollComplete(workflow);
    await effects.specialDuration(workflow);
    await effects.removeWorkflowEffects(workflow);
    if (genericUtils.getCPRSetting('cleave')) await cleave(workflow);
    if (genericUtils.getCPRSetting('devTools')) console.log(workflow);
}
async function postAttackRoll(workflow) {
    if (!workflow.attackRoll) return;
    let sceneTriggers = [];
    workflow.token?.document.parent.tokens.filter(i => i.uuid !== workflow.token?.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token}, 'scenePostAttackRoll'));
    });
    let sortedSceneTriggers = [];
    let names = new Set();
    sceneTriggers.forEach(i => {
        if (names.has(i.name)) return;
        sortedSceneTriggers.push(i);
        names.add(i.name);
    });
    sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: scenePostAttackRoll');
    for (let trigger of sortedSceneTriggers) await executeMacro(trigger, workflow);
    await executeMacroPass(workflow, 'postAttackRoll');
    await executeTargetMacroPass(workflow, 'targetPostAttackRoll');
}
async function preTargetDamageApplication(token, {workflow, ditem}) {
    genericUtils.log('dev', 'Executing Midi Macro Pass: applyDamage for ' + token.document.name);
    let targetTriggers = getSortedTriggers({token, actor: token.actor}, 'targetApplyDamage');
    let selfTriggers = getSortedTriggers({item: workflow.item, token: workflow.token, actor: workflow.actor, activity: workflow.activity}, 'applyDamage');
    let sceneTriggers = [];
    token.document.parent.tokens.filter(i => i.uuid != token.document.uuid && i.actor).forEach(j => {
        sceneTriggers.push(...getSortedTriggers({token: j.object, actor: j.actor, sourceToken: workflow.token, targetToken: token}, 'sceneApplyDamage'));
    });
    let sortedSceneTriggers = [];
    let names = new Set();
    sceneTriggers.forEach(i => {
        if (names.has(i.name)) return;
        sortedSceneTriggers.push(i);
        names.add(i.name);
    });
    let triggers = [...targetTriggers, ...selfTriggers, ...sortedSceneTriggers].sort((a, b) => a.priority - b.priority);
    genericUtils.log('dev', 'Executing Midi Macro Pass: applyDamage, targetApplyDamage, sceneApplyDamage');
    for (let trigger of triggers) await executeMacro(trigger, workflow, ditem);
}
export let midiEvents = {
    preTargeting,
    preItemRoll,
    attackRollComplete,
    savesComplete,
    damageRollComplete,
    rollFinished,
    preambleComplete,
    preTargetDamageApplication,
    postAttackRoll
};