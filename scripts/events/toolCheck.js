import {DialogApp} from '../applications/dialog.js';
import {heroicInspiration} from '../macros/2024/mechanics/heroicInspiration.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, regionUtils, templateUtils} from '../utils.js';
import {custom} from './custom.js';
function getMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.toolCheck ?? [];
}
function collectMacros(entity) {
    let macroList = [];
    macroList.push(...getMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j);
}
function collectActorCheckMacros(actor, pass) {
    let triggers = [];
    let effects = actorUtils.getEffects(actor, {includeItemEffects: true});
    let token = actorUtils.getFirstToken(actor);
    effects.forEach(effect => {
        let macroList = collectMacros(effect).filter(i => i.toolCheck?.find(j => j.pass === pass)).flatMap(k => k.toolCheck).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'toolCheck', {pass}));
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
        let macroList = collectMacros(item).filter(i => i.toolCheck?.find(j => j.pass === pass)).flatMap(k => k.toolCheck).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'toolCheck', {pass}));
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
            let macroList = collectMacros(template).filter(i => i.toolCheck?.find(j => j.pass === pass)).flatMap(k => k.toolCheck).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(template, 'toolCheck', {pass}));
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
            let macroList = collectMacros(region).filter(i => i.toolCheck?.find(j => j.pass === pass)).flatMap(k => k.toolCheck).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(region, 'toolCheck', {pass}));
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
function getSortedTriggers(actor, pass, tool, options, roll, config, dialog, message, sourceActor) {
    let allTriggers = collectActorCheckMacros(actor, pass);
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
                tool,
                options,
                roll,
                config,
                dialog,
                message,
                sourceActor,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    let result;
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded Tool Check Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await custom.executeScript({script: trigger.macro, trigger});
        } else {
            genericUtils.log('dev', 'Executing Tool Check Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}
async function executeContextMacroPass(actor, pass, tool, options, roll, config, dialog, message) {
    genericUtils.log('dev', 'Executing Tool Check Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, tool, options, roll, config, dialog, message);
    let results = [];
    for (let i of triggers) results.push(await executeMacro(i));
    return results.filter(i => i);
}
async function executeMacroPass(actor, pass, tool, options, roll, config, dialog, message, sourceActor) {
    genericUtils.log('dev', 'Executing Tool Check Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, tool, options, roll, config, dialog, message, sourceActor);
    for (let i of triggers) await executeMacro(i);
}
async function executeBonusMacroPass(actor, pass, tool, options, roll, config, dialog, message) {
    genericUtils.log('dev', 'Executing Tool Check Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, tool, options, roll, config, dialog, message);
    for (let i of triggers) {
        i.roll = roll;
        let bonusRoll = await executeMacro(i);
        if (bonusRoll) roll = bonusRoll;
    }
    return CONFIG.Dice.D20Roll.fromRoll(roll);
}
async function rollToolCheck(wrapped, config, dialog, message) {
    let options = {};
    await executeMacroPass(this, 'situational', config.tool, options, undefined, config, dialog, message);
    let token = actorUtils.getFirstToken(this);
    if (token) {
        let sceneTriggers = [];
        token.document.parent.tokens.filter(i => i.uuid !== token.document.uuid && i.actor).forEach(j => {
            sceneTriggers.push(...getSortedTriggers(j.actor, 'sceneSituational', config.tool, options, undefined, config, dialog, message, this));
        });
        let sortedSceneTriggers = [];
        let names = new Set();
        sceneTriggers.forEach(i => {
            if (names.has(i.name)) return;
            sortedSceneTriggers.push(i);
            names.add(i.name);
        });
        sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
        genericUtils.log('dev', 'Executing Tool Check Macro Pass: sceneSituational');
        for (let trigger of sortedSceneTriggers) await executeMacro(trigger);
    }
    let selections = await executeContextMacroPass(this, 'context', config.tool, options, undefined, config, dialog, message);
    if (selections.length) {
        let advantages = selections.filter(i => i.type === 'advantage').map(j => ({label: j.label, name: 'advantage'}));
        let disadvantages = selections.filter(i => i.type === 'disadvantage').map(j => ({label: j.label, name: 'disadvantage'}));
        let selection = await DialogApp.dialog('CHRISPREMADES.ToolCheck.Title', undefined, [['checkbox', advantages, {displayAsRows: true}], ['checkbox', disadvantages, {displayAsRows: true}]], 'okCancel');
        if (selection?.buttons) {
            if (selection.advantage) {
                switch(selection.advantage.constructor.name) {
                    case 'Boolean': options.advantage = true; break;
                    case 'Array': options.advantage = selection.advantage.find(i => i); break;
                }
            }
            if (selection.disadvantage) {
                switch(selection.disadvantage.constructor.name) {
                    case 'Boolean': options.disadvantage = true; break;
                    case 'Array': options.disadvantage = selection.advantage.find(i => i); break;
                }
            }
        }
    }
    let returnData = await wrapped(config, dialog, {...message, create: false});
    returnData = returnData[0];
    if (!returnData) return;
    let oldOptions = returnData.options;
    returnData = await executeBonusMacroPass(this, 'bonus', config.tool, options, returnData, config, dialog, message);
    if (token) {
        let sceneTriggers = [];
        token.document.parent.tokens.filter(i => i.uuid !== token.document.uuid && i.actor).forEach(j => {
            sceneTriggers.push(...getSortedTriggers(j.actor, 'sceneBonus', config.tool, options, returnData, config, dialog, message, this));
        });
        let sortedSceneTriggers = [];
        let names = new Set();
        sceneTriggers.forEach(i => {
            if (names.has(i.name)) return;
            sortedSceneTriggers.push(i);
            names.add(i.name);
        });
        sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
        genericUtils.log('dev', 'Executing Tool Check Macro Pass: sceneBonus');
        for (let trigger of sortedSceneTriggers) {
            trigger.roll = returnData;
            let bonusRoll = await executeMacro(trigger);
            if (bonusRoll) returnData = CONFIG.Dice.D20Roll.fromRoll(bonusRoll);
        }
    }
    if (genericUtils.getCPRSetting('heroicInspiration')) {
        let heroicInspirationRoll = await heroicInspiration.saveSkillCheck(returnData, this);
        if (heroicInspirationRoll) returnData = heroicInspirationRoll;
    }
    if (returnData.options) genericUtils.mergeObject(returnData.options, oldOptions);
    await executeMacroPass(this, 'post', config.tool, options, returnData, config, dialog, message);
    return [returnData];
}
function patch() {
    genericUtils.log('dev', 'Roll Tool Check Patched!');
    libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollToolCheck', rollToolCheck, 'WRAPPER');
}
export let toolCheck = {
    patch
};