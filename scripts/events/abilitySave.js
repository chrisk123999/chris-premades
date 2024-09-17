import {DialogApp} from '../applications/dialog.js';
import {custom} from './custom.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, templateUtils} from '../utils.js';
function getMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.save ?? [];
}
function collectMacros(entity) {
    let macroList = [];
    macroList.push(...getMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i)).filter(j => j);
}
function collectActorSaveMacros(actor, pass, saveId, options, roll) {
    let triggers = [];
    let effects = actorUtils.getEffects(actor);
    let token = actorUtils.getFirstToken(actor);
    for (let effect of effects) {
        let macroList = collectMacros(effect);
        if (!macroList.length) continue;
        let effectMacros = macroList.filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass);
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
                priority: i.priority,
                actor: actor,
                custom: i.custom,
                saveId: saveId,
                options: options,
                roll: roll
            });
        });
    }
    for (let item of actor.items) {
        let macroList = collectMacros(item);
        if (!macroList.length) continue;
        let itemMacros = macroList.filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass);
        itemMacros.forEach(i => {
            triggers.push({
                entity: item,
                castData: {
                    castLevel: -1,
                    saveDC: itemUtils.getSaveDC(item)
                },
                macro: i.macro,
                name: item.name,
                priority: i.priority,
                actor: actor,
                custom: i.custom,
                saveId: saveId,
                options: options,
                roll: roll
            });
        });
    }
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        for (let template of templates) {
            let macroList = collectMacros(template);
            if (!macroList.length) continue;
            let templateMacros = macroList.filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass);
            templateMacros.forEach(i => {
                triggers.push({
                    entity: template,
                    castData: {
                        castLevel: templateUtils.getCastLevel(template),
                        baseLevel: templateUtils.getBaseLevel(template),
                        saveDC: templateUtils.getSaveDC(template)
                    },
                    macro: i.macro,
                    name: templateUtils.getName(template),
                    priority: i.priority,
                    actor: actor,
                    custom: i.custom,
                    saveId: saveId,
                    options: options,
                    roll: roll
                });
            });
        }
    }
    return triggers;
}
function getSortedTriggers(actor, pass, saveId, options, roll) {
    let allTriggers = collectActorSaveMacros(actor, pass, saveId, options, roll);
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
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    genericUtils.log('dev', 'Executing Save Macro: ' + trigger.macro.name + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
    let result;
    try {
        result = await trigger.macro({trigger});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
    return result;
}
async function executeContextMacroPass(actor, pass, saveId, options) {
    genericUtils.log('dev', 'Executing Save Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, saveId, options);
    let results = [];
    for (let i of triggers) results.push(await executeMacro(i));
    return results.filter(i => i);
}
async function executeMacroPass(actor, pass, saveId, options, roll) {
    genericUtils.log('dev', 'Executing Save Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, saveId, options, roll);
    for (let i of triggers) await executeMacro(i);
}
async function executeBonusMacroPass(actor, pass, saveId, options, roll) {
    genericUtils.log('dev', 'Executing Save Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, saveId, options, roll);
    for (let i of triggers) {
        i.roll = roll;
        let bonusRoll = await executeMacro(i);
        if (bonusRoll) roll = bonusRoll;
    }
    return roll;
}
async function save(wrapped, saveId, options = {}) {
    await executeMacroPass(this, 'situational', saveId, options);
    let selections = await executeContextMacroPass(this, 'context', saveId, options);
    if (selections.length) {
        let advantages = selections.filter(i => i.type === 'advantage').map(j => ({label: j.label, name: 'advantage'}));
        let disadvantages = selections.filter(i => i.type === 'disadvantage').map(j => ({label: j.label, name: 'disadvantage'}));
        let selection = await DialogApp.dialog('CHRISPREMADES.AbilitySave.Title', undefined, [['checkbox', advantages, {displayAsRows: true}], ['checkbox', disadvantages, {displayAsRows: true}]], 'okCancel');
        if (selection.buttons) {
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
    let returnData = await wrapped(saveId, {...options, chatMessage: false});
    returnData = await executeBonusMacroPass(this, 'bonus', saveId, options, returnData);
    await returnData.toMessage({
        speaker: ChatMessage.implementation.getSpeaker({actor: this})
    });
    return returnData;
}
function patch() {
    genericUtils.log('dev', 'Ability Saves Patched!');
    libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollAbilitySave', save, 'WRAPPER');
}
export let abilitySave = {
    patch
};