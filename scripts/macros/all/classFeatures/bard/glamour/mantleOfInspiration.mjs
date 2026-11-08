import {actorUtils, dialogUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
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
    version: '2.1.8',
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
