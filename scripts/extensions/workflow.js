import {midiEvents} from '../events/midi.js';
import {genericUtils, workflowUtils} from '../utils.js';
import {CPRMultipleRollResolver} from '../applications/rollResolverMultiple.js';
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
            let manualRollsEnabled = genericUtils.getCPRSetting('manualRollsEnabled');
            if (manualRollsEnabled && (this.hitTargets?.size === 0 ? genericUtils.getCPRSetting('manualRollsPromptOnMiss') : true)) await newRolls();
            async function newRolls() {
                if (!genericUtils.getCPRSetting('manualRollsUsers')?.[game.user.id]) return false;
                let manualRollsInclusion = genericUtils.getCPRSetting('manualRollsInclusion');
                if (manualRollsInclusion === 0) return false;
                else if (manualRollsInclusion === 2 && this.actor.type != 'character') return false;
                else if (manualRollsInclusion === 3 && this.actor?.prototypeToken?.actorLink != true) return false;
                else if (!(manualRollsInclusion === 4 && this.actor?.prototypeToken?.actorLink === true && genericUtils.checkPlayerOwnership(this.actor.uuid === true))) return false;
                else if (manualRollsInclusion === 5 && genericUtils.checkPlayerOwnership(fromUuidSync(this.rolls[0].data?.actorUuid)) != true) return false;
                let newRolls = this.damageRolls.map(roll => new CONFIG.Dice.DamageRoll(roll.formula, roll.data, roll.options));
                let resolver = new CPRMultipleRollResolver(newRolls);
                await resolver.awaitFulfillment();
                newRolls.forEach(async roll => {
                    const ast = CONFIG.Dice.parser.toAST(roll.terms);
                    roll._total = await roll._evaluateASTAsync(ast);
                });
                resolver.close();
                await this.setDamageRolls(newRolls);
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
