import {actorUtils, workflowUtils} from '../../../../../proxy.mjs';
async function triggerSurge({document: activity}) {
    const feature = actorUtils.getItemByIdentifier(activity.actor, 'wild-surge', {type: 'feat'});
    if (feature) await workflowUtils.syntheticItemRoll(feature, [], {options: {activityIdentifier: 'wild-surge'}});
}
export const unstableBacklash = {
    name: 'Unstable Backlash',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: triggerSurge,
            priority: 50
        }
    ]
};
