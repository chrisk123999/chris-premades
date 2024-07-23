import {DialogApp} from '../applications/dialog.js';
import * as macros from '../macros.js';
import {genericUtils} from '../utils.js';
let skillMacros;
function init() {
    skillMacros = Object.values(macros).filter(i => i.skill).map(j => j.skill).flat().map(k => k.macro);
}
async function rollSkill(wrapped, skillId, options = {}) {
    let selections = await Promise.all(skillMacros.map(async macro => {
        return await macro(this, skillId, options);
    }));
    if (selections.length) {
        let advantages = selections.filter(i => i.type === 'advantage').map(j => ({label: j.label, name: 'advantage'}));
        let disadvantages = selections.filter(i => i.type === 'disadvantage').map(j => ({label: j.label, name: 'disadvantage'}));
        let selection = await DialogApp.dialog('CHRISPREMADES.SkillCheck.Title', undefined, [['checkbox', advantages, {displayAsRows: true}], ['checkbox', disadvantages, {displayAsRows: true}]], 'okCancel');
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
    let returnData = await wrapped(skillId, options);
    return returnData;
}
function patch(enabled) {
    if (enabled) {
        genericUtils.log('log', 'Skill Checks Patched!');
        libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSkill', rollSkill, 'WRAPPER');
    } else {
        genericUtils.log('log', 'Skill Check Patch Removed!');
        libWrapper.unregister('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSkill');
    }
}
export let skillCheck = {
    init,
    patch
};