import {genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'rollForActivity');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let rollTotal = workflow.utilityRolls[0]?.total;
    if (!rollTotal) return;
    let itemActivities = workflow.item.system.activities;
    let rolledActivities = itemActivities.filter(i => i.name.includes(String(rollTotal)));
    if (!rolledActivities.length) genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.RollForActivity.Error', {name: workflow.item.name, total: rollTotal}), 'error');
    for (let i of rolledActivities) await workflowUtils.syntheticActivityRoll(i, workflow.targets);
}
export let rollForActivity = {
    name: 'Roll for Activity',
    translation: 'CHRISPREMADES.Macros.RollForActivity.Name',
    version: '1.3.34',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
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
        }
    ]
};