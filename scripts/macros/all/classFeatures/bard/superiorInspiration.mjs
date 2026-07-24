import {actorUtils, automationUtils, workflowUtils} from '../../../../proxy.mjs';
async function combatStart({document: activity}) {
    const feature = actorUtils.getItemByIdentifier(activity.actor, 'bardic-inspiration');
    if (!feature) return;
    const minimum = automationUtils.getConfigValue(activity.item, 'minimum');
    if (feature.system.uses.value >= minimum) return;
    const data = activity.toObject();
    data.consumption.targets = [{
        target: 'bardic-inspiration',
        type: 'itemUses',
        value: '-' + (minimum - feature.system.uses.value)
    }];
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, []);
}
export const superiorInspiration = {
    name: 'Superior Inspiration',
    version: '2.0.2',
    rules: 'all',
    combat: [
        {
            pass: 'actorCombatStart',
            macro: combatStart,
            priority: 50
        }
    ],
    config: {
        minimum: {
            default: 1,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.All.SuperiorInspiration'
        }
    }
};
