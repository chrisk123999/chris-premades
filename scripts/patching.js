import {saves, skills} from './macros.js';
import {manualRolls} from './macros/mechanics/manualRolls.js';
let patchingDone = false;
export function patching() {
    if (patchingDone) return;
    console.log('Chris Premades | Patching Midi-Qol!');
    libWrapper.register('chris-premades', 'MidiQOL.Workflow.prototype.callMacros', workflow, 'WRAPPER');
    patchingDone = true;
}
async function workflow(wrapped, ...args) {
    let result = wrapped(...args);
    if (!game.settings.get('chris-premades', 'Manual Rolls')) return result;
    if (args[3] != 'postDamageRoll') return result;
    let workflow =  MidiQOL.Workflow.getWorkflow(args[0].uuid);
    if (!workflow) return result;
    await manualRolls.damageRoll(workflow);
    return result;
}
export function patchSkills(enabled) {
    if (enabled) {
        libWrapper.register('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSkill', doRollSkill, 'WRAPPER');
    } else {
        libWrapper.unregister('chris-premades', 'CONFIG.Actor.documentClass.prototype.rollSkill');
    }
}
async function doRollSkill(wrapped, ...args) {
    let [skillId, options] = args;
    let flags = this.flags['chris-premades']?.skill;
    if (!flags) return wrapped(skillId, options);
    for (let [key, value] of Object.entries(flags)) {
        if (!value) continue;
        if (typeof skills[key] != 'function') continue;
        await skills[key].bind(this)(skillId, options);
    }
    return wrapped(skillId, options);
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
    if (!flags) return wrapped(saveId, options);
    for (let [key, value] of Object.entries(flags)) {
        if (!value) continue;
        if (typeof saves[key] != 'function') continue;
        await saves[key].bind(this)(saveId, options);
    }
    return wrapped(saveId, options);
}