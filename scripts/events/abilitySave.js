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
    effects.forEach(effect => {
        let macroList = collectMacros(effect);
        if (!macroList.length) return;
        let effectMacros = macroList.filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass);
        if (!effectMacros.length) return;
        triggers.push({
            entity: effect,
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            },
            macros: effectMacros,
            name: effect.name.slugify(),
            actor: actor,
            saveId: saveId,
            options: options,
            roll: roll
        });
    });
    actor.items.forEach(item => {
        let macroList = collectMacros(item);
        if (!macroList.length) return;
        let itemMacros = macroList.filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass);
        if (!itemMacros.length) return;
        triggers.push({
            entity: item,
            castData: {
                castLevel: -1,
                saveDC: itemUtils.getSaveDC(item)
            },
            macros: itemMacros,
            name: item.name.slugify(),
            actor: actor,
            saveId: saveId,
            options: options,
            roll: roll
        });
    });
    if (token) {
        let templates = templateUtils.getTemplatesInToken(token);
        templates.forEach(template => {
            let macroList = collectMacros(template);
            if (!macroList.length) return;
            let templateMacros = macroList.filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass);
            if (!templateMacros.length) return;
            triggers.push({
                entity: template,
                castData: {
                    castLevel: templateUtils.getCastLevel(template),
                    baseLevel: templateUtils.getBaseLevel(template),
                    saveDC: templateUtils.getSaveDC(template)
                },
                macros: templateMacros,
                name: templateUtils.getName(template).slugify(),
                actor: actor,
                saveId: saveId,
                options: options,
                roll: roll
            });
        });
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
    let sortedTriggers = [];
    triggers.forEach(trigger => {
        trigger.macros.forEach(macro => {
            sortedTriggers.push({
                entity: trigger.entity,
                castData: trigger.castData,
                macro: macro.macro,
                priority: macro.priority,
                name: trigger.name,
                actor: trigger.actor,
                saveId: trigger.saveId,
                options: trigger.options,
                roll: trigger.roll
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
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
    return CONFIG.Dice.D20Roll.fromRoll(roll);
}
async function save(wrapped, saveId, options = {}) {
    await executeMacroPass(this, 'situational', saveId, options);
    let selections = await executeContextMacroPass(this, 'context', saveId, options);
    if (selections.length) {
        let advantages = selections.filter(i => i.type === 'advantage').map(j => ({label: j.label, name: 'advantage'}));
        let disadvantages = selections.filter(i => i.type === 'disadvantage').map(j => ({label: j.label, name: 'disadvantage'}));
        let selection = await DialogApp.dialog('CHRISPREMADES.AbilitySave.Title', undefined, [['checkbox', advantages, {displayAsRows: true}], ['checkbox', disadvantages, {displayAsRows: true}]], 'okCancel');
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
    let overtimeActorUuid;
    if (options.event) {
        let target = options.event?.target?.closest('.roll-link, [data-action="rollRequest"], [data-action="concentration"]');
        if (target?.dataset?.midiOvertimeActorUuid) {
            overtimeActorUuid = target.dataset.midiOvertimeActorUuid;
            options.rollMode = target.dataset.midiRollMode ?? options.rollMode;
        }
    }
    let messageData;
    let messageDataFunc = (actor, rollData, saveIdInternal) => {
        if (actor.uuid !== this.uuid || saveIdInternal !== saveId) {
            Hooks.once('dnd5e.preRollAbilitySave', messageDataFunc);
            return;
        }
        messageData = rollData.messageData;
        if (overtimeActorUuid) messageData['flags.midi-qol.overtimeActorUuid'] = overtimeActorUuid;
    };
    Hooks.once('dnd5e.preRollAbilitySave', messageDataFunc);
    let returnData = await wrapped(saveId, {...options, chatMessage: false});
    if (!returnData) return;
    let oldOptions = returnData.options;
    returnData = await executeBonusMacroPass(this, 'bonus', saveId, options, returnData);
    if (returnData.options) genericUtils.mergeObject(returnData.options, oldOptions);
    if (options.chatMessage !== false) {
        genericUtils.mergeObject(messageData, {flags: options.flags ?? {} });
        genericUtils.setProperty(messageData, 'flags.midi-qol.lmrtfy.requestId', options.flags?.lmrtfy?.data?.requestId);
        messageData.template = 'modules/midi-qol/templates/roll-base.html';
        await returnData.toMessage(messageData);
    }
    return returnData;
}
function patch() {
    genericUtils.log('dev', 'Ability Saves Patched!');
    libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollAbilitySave', save, 'WRAPPER');
}
export let abilitySave = {
    patch
};