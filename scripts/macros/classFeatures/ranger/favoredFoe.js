import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function extraDamage(workflow) {
    let scale = workflow.actor.system.scale?.ranger?.['favored-foe']?.formula;
    if (!scale) return;
    let bonusDamageFormula = scale + '[' + workflow.defaultDamageType + ']';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
}
export async function favoredFoe({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let originItem = chris.getItem(workflow.actor, 'Favored Foe');
    if (!originItem) return;
    let turnCheck = chris.perTurnCheck(originItem, 'feature', 'favoredFoe', true, workflow.token.id);
    if (!turnCheck) return;
    let targetToken = workflow.targets.first();
    let effect = chris.getEffects(targetToken.actor).find(i => i.name === 'Favored Foe' && i.origin === originItem.uuid);
    let queueSetup = await queue.setup(workflow.item.uuid, 'favoredFoe', 250);
    if (!queueSetup) return;
    if (effect) {
        await extraDamage(workflow);
        if (chris.inCombat()) await chris.setTurnCheck(originItem, 'feature', 'favoredFoe');
        queue.remove(workflow.item.uuid);
        return;
    }
    let uses = originItem.system.uses.value;
    if (!uses) return;
    let selection = await chris.dialog(originItem.name, constants.yesNo, 'Use Favored Foe?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(originItem, config, options);
    await originItem.update({'system.uses.value': uses - 1});
    await extraDamage(workflow);
    if (chris.inCombat()) await chris.setTurnCheck(originItem, 'feature', 'favoredFoe');
    queue.remove(workflow.item.uuid);
}