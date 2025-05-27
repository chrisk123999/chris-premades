import {DialogApp} from '../applications/dialog.js';
import {custom} from './custom.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, regionUtils, templateUtils} from '../utils.js';
function getMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.save ?? [];
}
function collectMacros(entity) {
    let macroList = [];
    macroList.push(...getMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j);
}
function collectActorSaveMacros(actor, pass) {
    let triggers = [];
    let effects = actorUtils.getEffects(actor, {includeItemEffects: true});
    let token = actorUtils.getFirstToken(actor);
    effects.forEach(effect => {
        let macroList = collectMacros(effect).filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'save', {pass}));
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
        let macroList = collectMacros(item).filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'save', {pass}));
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
            let macroList = collectMacros(template).filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(template, 'save', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: template,
                macros: macroList,
                name: templateUtils.getName(template).slugify(),
                castData: {
                    castLevel: templateUtils.getCastLevel(template) ?? -1,
                    baseLevel: templateUtils.getBaseLevel(template) ?? -1,
                    saveDC: templateUtils.getSaveDC(template) ?? -1
                }
            });
        });
        token.document.regions.forEach(region => {
            let macroList = collectMacros(region).filter(i => i.save?.find(j => j.pass === pass)).flatMap(k => k.save).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(region, 'save', {pass}));
            if (!macroList.length) return;
            triggers.push({
                entity: region,
                macros: macroList,
                name: region.name,
                castData: {
                    castLevel: regionUtils.getCastLevel(region),
                    baseLevel: regionUtils.getBaseLevel(region),
                    saveDC: regionUtils.getSaveDC(region)
                }
            });
        });
    }
    return triggers;
}
function getSortedTriggers(actor, pass, saveId, options, roll, config, dialog, message, sourceActor) {
    let allTriggers = collectActorSaveMacros(actor, pass);
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
                actor,
                saveId,
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
            genericUtils.log('dev', 'Executing Embedded Ability Save Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await custom.executeScript({script: trigger.macro, trigger});
        } else {
            genericUtils.log('dev', 'Executing Ability Save Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            result = await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}
async function executeContextMacroPass(actor, pass, saveId, options, roll, config, dialog, message) {
    genericUtils.log('dev', 'Executing Ability Save Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, saveId, options, roll, config, dialog, message);
    let results = [];
    for (let i of triggers) results.push(await executeMacro(i));
    return results.filter(i => i);
}
async function executeMacroPass(actor, pass, saveId, options, roll, config, dialog, message) {
    genericUtils.log('dev', 'Executing Ability Save Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, saveId, options, roll, config, dialog, message);
    for (let i of triggers) await executeMacro(i);
}
async function executeBonusMacroPass(actor, pass, saveId, options, roll, config, dialog, message) {
    genericUtils.log('dev', 'Executing Ability Save Macro Pass: ' + pass);
    let triggers = getSortedTriggers(actor, pass, saveId, options, roll, config, dialog, message);
    for (let i of triggers) {
        i.roll = roll;
        let bonusRoll = await executeMacro(i);
        if (bonusRoll) roll = bonusRoll;
    }
    return CONFIG.Dice.D20Roll.fromRoll(roll);
}
function _applyDeprecatedD20Configs(rollConfig, dialogConfig, messageConfig, options) {
    const set = (config, keyPath, value) => {
        if ( value === undefined ) return;
        foundry.utils.setProperty(config, keyPath, value);
    };
  
    let roll = rollConfig.rolls?.[0] ?? {};
    set(roll, 'parts', options.parts);
    set(roll, 'data', options.data);
    set(rollConfig, 'event', options.event);
    set(roll, 'options.advantage', options.advantage);
    set(roll, 'options.disadvantage', options.disadvantage);
    set(roll, 'options.criticalSuccess', options.critical);
    set(roll, 'options.criticalFailure', options.fumble);
    set(rollConfig, 'target', options.targetValue);
    set(rollConfig, 'ammunition', options.ammunition);
    set(rollConfig, 'attackMode', options.attackMode);
    set(rollConfig, 'mastery', options.mastery);
    set(rollConfig, 'elvenAccuracy', options.elvenAccuracy);
    set(rollConfig, 'halflingLucky', options.halflingLucky);
    set(rollConfig, 'reliableTalent', options.reliableTalent);
    set(rollConfig, 'midiOptions', {});
    set(rollConfig, 'midiOptions.simulate', options.simulate);
    set(rollConfig, 'midiOptions.isMagicalSave', options.isMagicalSave);
    set(rollConfig, 'midiOptions.isConcentrationCheck', options.isConcentrationCheck);
    set(rollConfig, 'midiOptions.saveItemUuid', options.saveItemUuid);
    set(rollConfig, 'midiOptions.fromMars5eChatCard', options.fromMars5eChatCard);
    if ( 'fastForward' in options ) dialogConfig.configure = !options.fastForward;
    set(dialogConfig, 'options', options.dialogOptions);
    set(dialogConfig, 'options.ammunitionOptions', options.ammunitionOptions);
    set(dialogConfig, 'options.attackModeOptions', options.attackModes);
    set(dialogConfig, 'options.chooseAbility', options.chooseModifier);
    set(dialogConfig, 'options.masteryOptions', options.masteryOptions);
    set(dialogConfig, 'options.title', options.title);
    set(messageConfig, 'create', options.chatMessage);
    set(messageConfig, 'data', options.messageData);
    set(messageConfig, 'rollMode', options.rollMode);
    set(messageConfig, 'data.flavor', options.flavor);
  
    if ( !foundry.utils.isEmpty(roll) ) {
        rollConfig.rolls ??= [];
        if ( rollConfig.rolls[0] ) rollConfig.rolls[0] = roll;
        else rollConfig.rolls.push(roll);
    }
}
async function rollSave(wrapped, config, dialog = {}, message = {}) {
    let event;
    let shouldBeArray = true;
    if (foundry.utils.getType(config) !== 'Object') {
        shouldBeArray = false;
        let options = genericUtils.duplicate(dialog);
        event = dialog.event;
        config = {
            ability: config
        };
        dialog = {};
        message = {};
        // _applyDeprecatedD20Configs from 5e system
        _applyDeprecatedD20Configs(config, dialog, message, options);
        config.event = event;
    }
    let saveId = config.ability;
    event = config.event;
    if (config.midiOptions?.saveItemUuid) {
        let activityUuid = game.messages.contents.toReversed().find(i => i.flags.dnd5e?.item?.uuid === config.midiOptions.saveItemUuid)?.flags.dnd5e.activity.uuid;
        if (activityUuid) genericUtils.setProperty(config, 'chris-premades.activityUuid', activityUuid);
    }
    let options = {};
    await executeMacroPass(this, 'situational', saveId, options, undefined, config, dialog, message);
    let selections = await executeContextMacroPass(this, 'context', saveId, options, undefined, config, dialog, message);
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
    if (event) {
        let target = event.target?.closest('.roll-link, [data-action="rollRequest"], [data-action="concentration"]');
        if (target?.dataset?.midiOvertimeActorUuid) {
            overtimeActorUuid = target.dataset.midiOvertimeActorUuid;
            options.rollMode = target.dataset.midiRollMode ?? target.dataset.rollMode ?? options.rollMode;
        }
    }
    let messageData;
    let rollMode;
    let messageDataFunc = (config, dialog, message) => {
        let actor = config.subject;
        let saveIdInternal = config.ability;
        if (actor.uuid !== this.uuid || saveIdInternal !== saveId) {
            Hooks.once('dnd5e.preRollSavingThrowV2', messageDataFunc);
            return;
        }
        messageData = message.data;
        if (overtimeActorUuid) messageData['flags.midi-qol.overtimeActorUuid'] = overtimeActorUuid;
        rollMode = message.rollMode ?? game.settings.get('core', 'rollMode');
    };
    Hooks.once('dnd5e.preRollSavingThrowV2', messageDataFunc);
    if (Object.entries(options).length) config.rolls = [{options}];
    config = {
        ...config,
        ...options
    };
    let returnData = await wrapped(config, dialog, {...message, create: false});
    returnData = returnData[0];
    if (!returnData) return;
    let oldOptions = returnData.options;
    returnData = await executeBonusMacroPass(this, 'bonus', saveId, options, returnData, config, dialog, message);
    if (returnData.data?.token) {
        let sceneTriggers = [];
        returnData.data.token.document.parent.tokens.filter(i => i.uuid !== returnData.data.token.document.uuid && i.actor).forEach(j => {
            sceneTriggers.push(...getSortedTriggers(j.actor, 'sceneBonus', saveId, options, returnData, config, dialog, message, this));
        });
        let sortedSceneTriggers = [];
        let names = new Set();
        sceneTriggers.forEach(i => {
            if (names.has(i.name)) return;
            sortedSceneTriggers.push(i);
            names.add(i.name);
        });
        sortedSceneTriggers = sortedSceneTriggers.sort((a, b) => a.priority - b.priority);
        genericUtils.log('dev', 'Executing Save Macro Pass: sceneBonus');
        for (let trigger of sortedSceneTriggers) {
            trigger.roll = returnData;
            let bonusRoll = await executeMacro(trigger);
            if (bonusRoll) returnData = CONFIG.Dice.D20Roll.fromRoll(bonusRoll);
        }
    }
    if (returnData.options) genericUtils.mergeObject(returnData.options, oldOptions);
    if (message.create !== false) {
        let messageId = event?.target.closest('[data-message-id]')?.dataset.messageId;
        if (messageId) genericUtils.mergeObject(messageData, {'flags.dnd5e.originatingMessage': messageId});
        genericUtils.mergeObject(messageData, {flags: options.flags ?? {} });
        genericUtils.setProperty(messageData, 'flags.midi-qol.lmrtfy.requestId', options.flags?.lmrtfy?.data?.requestId);
        messageData.template = 'modules/midi-qol/templates/roll-base.html';
        await returnData.toMessage(messageData, {rollMode: returnData.options?.rollMode ?? rollMode});
    }
    await executeMacroPass(this, 'post', saveId, options, returnData, config, dialog, message);
    return shouldBeArray ? [returnData] : returnData;
}
function patch() {
    genericUtils.log('dev', 'Ability Saves Patched!');
    libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSavingThrow', rollSave, 'WRAPPER');
}
export let abilitySave = {
    patch
};