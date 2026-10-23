import {automationUtils, dialogUtils, workflowUtils} from '../../../../../proxy.mjs';
async function targets({document: activity, workflow}) {
    const maxAmount = automationUtils.getConfigValue(activity.item, 'targets');
    if (workflow.targets.size <= maxAmount) return;
    const oldTargets = Array.from(workflow.targets).map(t => t.document);
    const preselected = oldTargets.reduce((obj, t) => 
        (obj[t.id] = workflow.token.document.disposition * t.disposition >= 0 && obj.count++ < maxAmount, obj),
    {count: 0});
    const choice = await dialogUtils.selectTargetDialog(
        activity.item.name,
        _loc('CHRISPREMADES.Generic.SelectTargets', {maxAmount}),
        oldTargets,
        {type: 'multiple', skipDeadAndUnconscious: false, maxAmount, preselected}
    );
    await workflowUtils.updateTargets(workflow, choice?.result?.length ? choice.result : oldTargets.slice(0, maxAmount));
}
export const zealousPresence = {
    name: 'Zealous Presence',
    version: '2.1.4',
    rules: 'all',
    roll: [
        {
            pass: 'activityTargeting',
            macro: targets,
            priority: 50
        }
    ],
    config: {
        targets: {
            default: 10,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets'
        }
    }
};
