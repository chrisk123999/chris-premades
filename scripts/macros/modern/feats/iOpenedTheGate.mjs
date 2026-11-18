import {actorUtils, dialogUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function cast({document: item, workflow}) {
    if (workflow.item?.type !== 'spell' || !workflow.activity?.save || !item.system.uses.value) return;
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.IOpenedTheGate.Use', {name: workflow.item.name}), {userId: queryUtils.firstOwner(item.actor, true)})) return;
    const activityData = workflow.activity.toObject();
    activityData.save.dc = {calculation: '', formula: String(workflow.activity.save.dc.value + 2)};
    await workflowUtils.setActivity(workflow, activityData);
    workflowUtils.setWorkflowProperty(workflow, 'foulArcana', true);
}
async function paralyze({document: item, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'foulArcana')) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'foul-arcana');
    const token = actorUtils.getFirstToken(item.actor);
    if (activity) await workflowUtils.completeActivityUse(activity, token ? [token] : [], {fast: true});
}
export const iOpenedTheGate = {
    name: 'I Opened the Gate',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: cast,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: paralyze,
            priority: 50
        }
    ]
};
