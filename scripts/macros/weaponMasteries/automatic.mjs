import {dialogUtils, itemUtils, workflowUtils} from '../../proxy.mjs';
async function attack({workflow}) {
    const label = itemUtils.getMasteryLabel('automatic');
    if (!workflowUtils.getWorkflowProperty(workflow, 'automaticSecond')) {
        if (!await dialogUtils.confirm(label, _loc('CHRISPREMADES.WeaponMasteries.Automatic.Prompt'))) return;
        workflowUtils.setWorkflowProperty(workflow, 'automatic', true);
    }
    workflow.tracker.advantage.suppress('automatic', label);
    workflow.tracker.disadvantage.add('automatic', label);
}
async function finished({workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'automatic')) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'automaticSecond', true);
    await workflowUtils.syntheticActivityRoll(workflow.activity, Array.from(workflow.targets, token => token.document), {options, consumeUsage: false});
}
export const automaticMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Automatic.Label',
    roll: [
        {pass: 'itemAttackRollConfig', macro: attack, priority: 50},
        {pass: 'itemRollFinished', macro: finished, priority: 300}
    ]
};
