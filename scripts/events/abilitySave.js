import {DialogApp} from '../applications/dialog.js';
import * as macros from '../macros.js';
import {genericUtils} from '../utils.js';
let saveMacros;
function init() {
    saveMacros = Object.values(macros).filter(i => i.save).flatMap(j => j.save).map(k => k.macro);
}
async function save(wrapped, saveId, options = {}) {
    let selections = await Promise.all(saveMacros.map(async macro => {
        return await macro(this, saveId, options);
    }));
    selections = selections.filter(i => !!i);
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
    let returnData = await wrapped(saveId, options);
    return returnData;
}
function patch(enabled) {
    if (enabled) {
        genericUtils.log('log', 'Ability Saves Patched!');
        libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollAbilitySave', save, 'WRAPPER');
    } else {
        genericUtils.log('log', 'Ability Saves Patch Removed!');
        libWrapper.unregister('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollAbilitySave');
    }
}
export let abilitySave = {
    init,
    patch
};