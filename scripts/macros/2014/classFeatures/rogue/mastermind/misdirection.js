import {actorUtils, dialogUtils, genericUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function attacked({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    if (actorUtils.hasUsedReaction(item.actor)) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let nearby = tokenUtils.findNearby(workflow.targets.first(), 5, 'all', {includeIncapacitated: true});
    if (!nearby.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), nearby, {skipDeadAndUnconscious: false, userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.token]);
    await workflowUtils.updateTargets(workflow, [selection[0]]);
}
export let misdirection = {
    name: 'Misdirection',
    version: '1.3.135',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: attacked,
                priority: 100
            }
        ]
    }
};