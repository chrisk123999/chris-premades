import {itemUtils, workflowUtils} from '../../../../utils.js';
async function use({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'failedByAmount');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let targets = workflow.failedSaves.filter(i => workflow.tokenSaves[i.document.uuid].total <= (workflow.saveDC - config.amount));
    if (!targets.size) return;
    let triggerActivities = config.triggerActivities.map(i => workflow.item.system.activities.find(j => j.id === i));
    if (!triggerActivities.length) return;
    for (let activity of triggerActivities) await workflowUtils.syntheticActivityRoll(activity, Array.from(targets), {consumeResources: true, consumeUsage: true});
}
export let failedByAmount = {
    name: 'Failed By Amount',
    translation: 'CHRISPREMADES.Macros.FailedByAmount.Name',
    version: '1.3.39',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'triggerActivities',
            label: 'CHRISPREMADES.Macros.ActivityOnRest.TriggerActivities',
            type: 'activities',
            default: []
        },
        {
            value: 'amount',
            label: 'CHRISPREMADES.Macros.FailedByAmount.Amount',
            type: 'number',
            default: '5'
        }
    ]
};