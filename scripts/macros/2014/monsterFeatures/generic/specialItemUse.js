import {actorUtils, genericUtils, itemUtils, tokenUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function use({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'specialItemUse');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let itemIds = config.triggerItems;
    let items = workflow.item?.actor?.items.filter(i => itemIds.includes(i.id));
    if (!items.length) return;
    for (let i of items) {
        await workflowUtils.specialItemUse(i, workflow.targets, workflow.item);
    }
}
export let specialItemUse = {
    name: 'Special Item Use',
    translation: 'CHRISPREMADES.Macros.SpecialItemUse.Name',
    version: '1.3.37',
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
        },
        {
            value: 'triggerItems',
            label: 'CHRISPREMADES.Macros.SpecialItemUse.TriggerItems',
            type: 'items',
            default: []
        }
    ]
};