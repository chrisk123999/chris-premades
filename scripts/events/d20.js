import {actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, regionUtils, templateUtils} from '../utils.js';
import {custom} from './custom.js';

function getMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.d20 ?? [];
}
function collectMacros(entity) {
    let macroList = [];
    macroList.push(...getMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j);
}
function collectActorCheckMacros(actor, pass, token) {
    let triggers = [];
    let effects = actorUtils.getEffects(actor, {includeItemEffects: true});
    effects.forEach(effect => {
        let macroList = collectMacros(effect).filter(i => i.d20?.find(j => j.pass === pass)).flatMap(k => k.d20).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'd20', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: effect,
            macros: macroList,
            name: effect.name.slugify(),
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            }
        });
    });
    actor.items.forEach(item => {
        let macroList = collectMacros(item).filter(i => i.d20?.find(j => j.pass === pass)).flatMap(k => k.d20).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'd20', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: item,
            macros: macroList,
            name: item.name.slugify(),
            castData: {
                castLevel: -1,
                baseLevel: -1,
                saveDC: itemUtils.getSaveDC(item) ?? -1
            }
        });
    });
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        templates.forEach(template => {
            let macroList = collectMacros(template).filter(i => i.d20?.find(j => j.pass === pass)).flatMap(k => k.d20).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(template, 'd20', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: template,
                macroList,
                name: templateUtils.getName(template).slugify(),
                castData: {
                    castLevel: templateUtils.getCastLevel(template) ?? -1,
                    baseLevel: templateUtils.getBaseLevel(template) ?? -1,
                    saveDC: templateUtils.getSaveDC(template) ?? -1
                }
            });
        });
        token.document.regions.forEach(region => {
            let macroList = collectMacros(region).filter(i => i.d20?.find(j => j.pass === pass)).flatMap(k => k.d20).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(region, 'd20', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: region,
                macroList,
                name: regionUtils.getName(region).slugify(),
                castData: {
                    castLevel: regionUtils.getCastLevel(region) ?? -1,
                    baseLevel: regionUtils.getBaseLevel(region) ?? -1,
                    saveDC: regionUtils.getSaveDC(region) ?? -1
                }
            });
        });
    }
    return triggers;
}
function getSortedTriggers(actor, pass, options, roll, sourceActor, token) {
    let allTriggers = collectActorCheckMacros(actor, pass, token);
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
                macro: macro.macro,
                priority: macro.priority,
                name: trigger.name,
                actor,
                options,
                roll,
                sourceActor,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name,
                token
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    let result;
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded D20 Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await custom.executeScript({script: trigger.macro, trigger});
        } else {
            genericUtils.log('dev', 'Executing D20 Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}
async function executeMacroPass(actor, pass, options, roll, sourceActor) {
    genericUtils.log('dev', 'Executing D20 Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, options, roll, sourceActor);
    for (let i of triggers) await executeMacro(i);
}
async function executeBonusMacroPass(actor, pass, options, roll, sourceActor, token) {
    genericUtils.log('dev', 'Executing D20 Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, options, roll, sourceActor, token);
    for (let i of triggers) {
        i.roll = roll;
        let bonusRoll = await executeMacro(i);
        if (bonusRoll) roll = bonusRoll;
    }
    return CONFIG.Dice.D20Roll.fromRoll(roll);
}
async function preEvaluation(roll, options) {
    let actor = await fromUuid(roll.data.actorUuid);
    if (!actor) return;
    let token = actorUtils.getFirstToken(actor);
    await executeMacroPass(actor, 'preEvaluation', options, roll, undefined, token);
    if (token) {
        let sceneTriggers = [];
        token.document.parent.tokens.filter(i => i.uuid !== token.document.uuid && i.actor).forEach(j => {
            sceneTriggers.push(...getSortedTriggers(j.actor, 'scenePreEvaluation', options, roll, actor, token));
        });
        let sortedSceneTriggers = [];
        let names = new Set();
        sceneTriggers.forEach(i => {
            if (names.has(i.name)) return;
            sortedSceneTriggers.push(i);
            names.add(i.name);
        });
        sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
        genericUtils.log('dev', 'Executing D20 Macro Pass: scenePreEvaluation');
        for (let trigger of sortedSceneTriggers) await executeMacro(trigger);
    }
}
async function postEvaluation(roll, options) {
    let actor = await fromUuid(roll.data.actorUuid);
    if (!actor) return;
    let token = actorUtils.getFirstToken(actor);
    let returnData = await executeBonusMacroPass(actor, 'postEvaluation', options, roll, undefined, token);
    if (token) {
        let sceneTriggers = [];
        token.document.parent.tokens.filter(i => i.uuid !== token.document.uuid && i.actor).forEach(j => {
            sceneTriggers.push(...getSortedTriggers(j.actor, 'scenePostEvaluation', options, roll, actor, token));
        });
        let sortedSceneTriggers = [];
        let names = new Set();
        sceneTriggers.forEach(i => {
            if (names.has(i.name)) return;
            sortedSceneTriggers.push(i);
            names.add(i.name);
        });
        sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
        genericUtils.log('dev', 'Executing D20 Macro Pass: scenePostEvaluation');
        for (let trigger of sortedSceneTriggers) {
            trigger.roll = returnData;
            let bonusRoll = await executeMacro(trigger);
            if (bonusRoll) returnData = CONFIG.Dice.D20Roll.fromRoll(bonusRoll);
        }
    }
    return returnData;
}
export let d20 = {
    preEvaluation,
    postEvaluation
};