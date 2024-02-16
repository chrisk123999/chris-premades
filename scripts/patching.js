import {constants} from './constants.js';
import {chris} from './helperFunctions.js';
import {saves, skills} from './macros.js';
import {tempEffectHUD} from './userInterface.js';
export function patchSkills(enabled) {
    if (enabled) {
        libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSkill', doRollSkill, 'WRAPPER');
    } else {
        libWrapper.unregister('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSkill');
    }
}
async function doRollSkill(wrapped, ...args) {
    let [skillId, options] = args;
    if (!options) options = {};
    let flags = this.flags['chris-premades']?.skill;
    if (flags) {
        let selections = [];
        for (let [key, value] of Object.entries(flags)) {
            if (!value) continue;
            if (typeof skills[key] != 'function') continue;
            let data = skills[key].bind(this)(skillId, options);
            if (data) selections.push(data);
        }
        if (selections.length) {
            let advantages = selections.filter(i => i.type === 'advantage').map(j => ({'type': 'checkbox', 'label': j.label, 'options': false}));
            let disadvantags = selections.filter(i => i.type === 'disadvantage').map(j => ({'type': 'checkbox', 'label': j.label, 'options': false}));
            let generatedInputs = [];
            if (advantages.length) {
                generatedInputs.push({'label': '<u>Advantage:</u>', 'type': 'info'});
                generatedInputs.push(...advantages);
            }
            if (disadvantags.length) {
                generatedInputs.push({'label': '<u>Disadvantage:</u>', 'type': 'info'});
                generatedInputs.push(...disadvantags);
            }
            let selection = await chris.menu('Skill Roll Options', constants.okCancel, generatedInputs, true);
            if (selection.buttons) {
                let advantage = false;
                let disadvantage = false;
                if (advantages.length) advantage = !!selection.inputs.slice(1, advantages.length + 1).find(i => i);
                if (disadvantags.length) {
                    let start = 1;
                    let end = disadvantags.length + 1;
                    if (advantages.length) {
                        start += advantages.length + 1;
                        end += advantages.length + 1;
                    }
                    disadvantage = !!selection.inputs.slice(start, end).find(i => i);
                }
                if (advantage) options.advantage = true;
                if (disadvantage) options.disadvantage = true;
            }
        }
    }
    let returnData = await wrapped(skillId, options);
    //roll bonus here
    return returnData;
}
export function patchSaves(enabled) {
    if (enabled) {
        libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollAbilitySave', doRollSave, 'WRAPPER');
    } else {
        libWrapper.unregister('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollAbilitySave');
    }
}
async function doRollSave(wrapped, ...args) {
    let [saveId, options] = args;
    let flags = this.flags['chris-premades']?.save;
    if (flags) {
        let selections = [];
        for (let [key, value] of Object.entries(flags)) {
            if (!value) continue;
            if (typeof saves[key] != 'function') continue;
            let data = saves[key].bind(this)(saveId, options);
            if (data) selections.push(data);
        }
        if (selections.length) {
            let advantages = selections.filter(i => i.type === 'advantage').map(j => ({'type': 'checkbox', 'label': j.label, 'options': false}));
            let disadvantags = selections.filter(i => i.type === 'disadvantage').map(j => ({'type': 'checkbox', 'label': j.label, 'options': false}));
            let generatedInputs = [];
            if (advantages.length) {
                generatedInputs.push({'label': '<u>Advantage:</u>', 'type': 'info'});
                generatedInputs.push(...advantages);
            }
            if (disadvantags.length) {
                generatedInputs.push({'label': '<u>Disadvantage:</u>', 'type': 'info'});
                generatedInputs.push(...disadvantags);
            }
            let selection = await chris.menu('Save Roll Options', constants.okCancel, generatedInputs, true);
            if (selection.buttons) {
                let advantage = false;
                let disadvantage = false;
                if (advantages.length) advantage = !!selection.inputs.slice(1, advantages.length + 1).find(i => i);
                if (disadvantags.length) {
                    let start = 1;
                    let end = disadvantags.length + 1;
                    if (advantages.length) {
                        start += advantages.length + 1;
                        end += advantages.length + 1;
                    }
                    disadvantage = !!selection.inputs.slice(start, end).find(i => i);
                }
                if (advantage) options.advantage = true;
                if (disadvantage) options.disadvantage = true;
            }
        }
    }
    let returnData = await wrapped(saveId, options);
    //roll bonus here
    return returnData;
}
export function patchActiveEffectSourceName(enabled) {
    if (enabled) {
        libWrapper.register('chris-premades', 'CONFIG.ActiveEffect.documentClass.prototype.sourceName', sourceName, 'WRAPPER');
    } else {
        libWrapper.unregister('chris-premades', 'CONFIG.ActiveEffect.documentClass.prototype.sourceName');
    }
}
function sourceName(wrapped, ...args) {
    let name = wrapped();
    if (name === 'Unknown' && this.origin != '') {
        if (!this.origin.includes('Compendium.')) {
            let origin = fromUuidSync(this.origin);
            if (origin) {
                if (origin.constructor.name === 'MeasuredTemplateDocument') {
                    let orginUuid = origin.flags?.dnd5e?.origin;
                    if (orginUuid) {
                        let originItem = fromUuidSync(orginUuid);
                        if (originItem) {
                            if (originItem.constructor.name === 'Item5e') name = originItem.name + ' Template';
                        }
                    } else name = 'Unknown Template';
                }
            }
        }
    }
    return name;
}
let toggleEffectPatched = false;
export async function patchToggleEffect(enabled) {
    if (enabled) {
        if (toggleEffectPatched) return;
        libWrapper.register('chris-premades', 'TokenHUD.prototype._onToggleEffect', toggleEffect, 'MIXED');
        libWrapper.ignore_conflicts('chris-premades', 'dfreds-convenient-effects', 'TokenHUD.prototype._onToggleEffect');
        Hooks.on('renderTokenHUD', tempEffectHUD);
        toggleEffectPatched = true;
    } else {
        if (!toggleEffectPatched) return;
        libWrapper.unregister('chris-premades', 'TokenHUD.prototype._onToggleEffect');
        Hooks.off('renderTokenHUD', tempEffectHUD);
        toggleEffectPatched = false;
    }
}
async function toggleEffect(wrapped, ...args) {
    let [event] = args;
    let img = event.currentTarget;
    let effectUuid = img.dataset.effectUuid;
    if (effectUuid) {
        let effect = await fromUuid(effectUuid);
        if (effect) {
            if (game.settings.get('chris-premades', 'Display Temporary Effects') === 1) {
                let selection = await chris.dialog(effect.name, constants.yesNo, 'Delete "' + effect.name + '" effect?');
                if (!selection) return;
            }
            await chris.removeEffect(effect);
        }
    } else {
        wrapped(event);
    }
}