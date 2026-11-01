import {automationUtils, dialogUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function targets({document: activity, workflow}) {
    const maxTargets = automationUtils.getConfigValue(activity.item, 'targets');
    const maxAmount = (await rollUtils.rollDice(maxTargets, {document: activity}))?.total ?? 1;
    if (workflow.targets.size <= maxAmount) return;
    const oldTargets = Array.from(workflow.targets).map(t => t.document);
    const choice = await dialogUtils.selectTargetDialog(
        activity.item.name,
        _loc('CHRISPREMADES.Generic.SelectTargets', {maxAmount}),
        oldTargets,
        {type: 'multiple', skipDeadAndUnconscious: false, maxAmount}
    );
    if (!choice) return workflow.aborted = true;
    await workflowUtils.updateTargets(workflow, choice?.result?.length ? choice.result : oldTargets.slice(0, maxAmount));
}
export const enthrallingPerformance = {
    name: 'Enthralling Performance',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'activityTargeting',
            macro: targets,
            priority: 55
        }
    ],
    config: {
        targets: {
            default: 'max(1, @abilities.cha.mod)',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets'
        }
    }
};
