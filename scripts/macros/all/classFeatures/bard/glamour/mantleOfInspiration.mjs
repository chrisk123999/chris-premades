import {actorUtils, automationUtils, dialogUtils, queryUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function targets({document: activity, workflow}) {
    const maxTargets = automationUtils.getConfigValue(activity.item, 'targets');
    const maxAmount = (await rollUtils.rollDice(maxTargets, {document: activity}))?.total ?? 1;
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
    if (!choice) return workflow.aborted = true;
    await workflowUtils.updateTargets(workflow, choice?.result?.length ? choice.result : oldTargets.slice(0, maxAmount));
}
async function use({document: activity, workflow}) {
    await Promise.all(workflow.targets.map(async t => {
        if (!t.actor) return;
        if (actorUtils.hasUsedReaction(t.actor)) return;
        if (t.actor.system.attributes.movement.max <= 0) return;
        const item = activity.item.toObject();
        const userId = queryUtils.firstOwner(t.actor, true);
        if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.MantleOfInspiration'), {userId})) return;
        await workflowUtils.syntheticItemDataRoll(item, t.actor, [], {options: {activityIdentifier: 'mantle-move'}, userId});
    }));
}
export const mantleOfInspiration = {
    name: 'Mantle of Inspiration',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'activityTargeting',
            macro: targets,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
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
