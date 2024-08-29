import {midiEvents} from '../events/midi.js';
import {genericUtils, workflowUtils} from '../utils.js';
function getDamageType(flavorString) {
    if (flavorString === '') return 'none';
    if (game.system.config.damageTypes[flavorString] !== undefined) {
        return flavorString;
    }
    if (game.system.config.healingTypes[flavorString] !== undefined) {
        return flavorString;
    }
    let validDamageTypes = Object.entries(game.system.config.damageTypes).map(e => { e[1] = e[1].label.toLowerCase(); return e; }).deepFlatten().concat(Object.entries(game.system.config.healingTypes).deepFlatten());
    let validHealingTypes = Object.entries(game.system.config.healingTypes).map(e => { e[1] = e[1].label.toLowerCase(); return e; }).deepFlatten();
    let validDamagingTypes = validDamageTypes.concat(validHealingTypes);
    let allDamagingTypeEntries = Object.entries(game.system.config.damageTypes).concat(Object.entries(game.system.config.healingTypes));
    if (validDamagingTypes.includes(flavorString?.toLowerCase()) || validDamageTypes.includes(flavorString)) {
        let damageEntry = allDamagingTypeEntries?.find(e => e[1].label.toLowerCase() === flavorString.toLowerCase());
        return damageEntry ? damageEntry[0] : flavorString;
    }
    return undefined;
}
let CPRClass;
function setup() {
    class CPRWorkflow extends MidiQOL.workflowClass {
        async WorkflowState_NoAction(context = {}) {
            let nextState = await super.WorkflowState_NoAction(context);
            let abort = await midiEvents.preItemRoll(this);
            if (abort) return this.WorkflowState_Abort;
            return nextState;
        }
        async WorkflowState_PreambleComplete(context = {}) {
            let nextState = await super.WorkflowState_PreambleComplete(context);
            await midiEvents.preambleComplete(this);
            return nextState;
        }
        async WorkflowState_AttackRollComplete(context = {}) {
            let nextState = await super.WorkflowState_AttackRollComplete(context);
            await midiEvents.attackRollComplete(this);
            return nextState;
        }
        async WorkflowState_DamageRollComplete(context = {}) {
            let nextState = await super.WorkflowState_DamageRollComplete(context);
            await midiEvents.damageRollComplete(this);
            let manualRollsSetting = true;
            if (manualRollsSetting) {/*test for manual rolls setting*/
                let newRolls = this.damageRolls.map(async roll => new CONFIG.Dice.DamageRoll(roll.formula, roll.data, genericUtils.mergeObject(roll.options, {forceDamageRoll: true})));
                // evaluate them
                //this.setDamageRolls(newRolls);
            }
            await this.displayDamageRolls(game.settings.get('midi-qol', 'ConfigSettings'), true);
            this.damageDetail = MidiQOL.createDamageDetail({roll: this.damageRolls, item: this.item, defaultType: this.defaultDamageType});
            return nextState;
        }
        async WorkflowState_RollFinished(context = {}) {
            let nextState = await super.WorkflowState_RollFinished(context);
            await midiEvents.rollFinished(this);
            return nextState;
        }
        async WorkflowState_WaitForAttackRoll(context = {}) {
            let nextState = await super.WorkflowState_WaitForAttackRoll(context);
            if (nextState === this.WorkflowState_AttackRollComplete) await midiEvents.postAttackRoll(this);
            return nextState;
        }
    }
    MidiQOL.workflowClass = CPRWorkflow;
    CPRClass = CPRWorkflow;
    patch();
}
async function callV3DamageHooks(wrapped, damages, token) {
    await midiEvents.preTargetDamageApplication(token, {workflow: this, ditem: damages});
    return await wrapped(damages, token);
}
async function displayDamageRolls(wrapped, doMerge, real) {
    if (real || this.constructor.name != CPRClass.name) return await wrapped(doMerge);
}
function patch() {
    libWrapper.register('chris-premades', 'MidiQOL.workflowClass.prototype.callv3DamageHooks', callV3DamageHooks, 'WRAPPER');
    libWrapper.register('chris-premades', 'MidiQOL.Workflow.prototype.displayDamageRolls', displayDamageRolls, 'MIXED');
}
export let workflow = {
    setup
};
