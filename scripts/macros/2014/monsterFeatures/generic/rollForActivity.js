import {genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'rollForActivity');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let rollTotal = workflow.utilityRolls[0]?.total;
    if (!rollTotal) return;
    let itemActivities = workflow.item.system.activities;
    let rolledActivities = itemActivities.filter(i => (new RegExp(`(?<!\\d)${rollTotal}(?!\\d)`).test(i.name)) && (i.id != workflow.activity.id));
    if (!rolledActivities.length) genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.RollForActivity.Error', {name: workflow.item.name, total: rollTotal}), 'error');
    if (config.reroll && !rolledActivities.filter(i => i.uses?.value != 0).length) {
        await workflowUtils.syntheticActivityRoll(workflow.activity, workflow.targets);
        return;
    }
    for (let i of rolledActivities) await workflowUtils.syntheticActivityRoll(i, workflow.targets, {consumeUsage: true, consumeResources: true});
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
            value: 'reroll',
            label: 'CHRISPREMADES.Macros.RollForActivity.PerTurn',
            type: 'checkbox',
            default: true
        }
    ]
};