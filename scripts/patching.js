import {manualRolls} from './macros/mechanics/manualRolls.js';
let patchingDone = false;
export async function patching() {
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