import {activityUtils, dialogUtils, itemUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
const grappleActivities = ['grapple', 'shove-prone', 'shove-push'];
async function inescapable({document: item, workflow}) {
    if (!grappleActivities.includes(workflow.activity?.identifier) || !workflow.targets.count) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'inescapable');
    if (!activity || !activityUtils.checkCosts(activity)) return;
    if (!await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.Modern.Groundwork.Inescapable', {userId: queryUtils.firstOwner(workflow.actor, true)})) return;
    const used = await workflowUtils.completeActivityUse(activity, []);
    if (!used) return;
    for (const target of workflow.targets.documents) workflowUtils.grantRollModifier(workflow, 'dis', target.id, 'inescapable', item.name);
}
export const groundwork = {
    name: 'Groundwork',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: inescapable,
            priority: 50
        }
    ]
};
