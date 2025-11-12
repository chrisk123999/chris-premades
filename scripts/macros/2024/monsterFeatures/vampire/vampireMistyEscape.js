import {activityUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let item = itemUtils.getItemByIdentifier(workflow.actor, 'vampireShapeShift');
    if (!item) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'mist');
    if (!activity) return;
    await workflowUtils.specialItemUse(item, [workflow.token], workflow.item, {activity});
}
export let vampireMistyEscape = {
    name: 'Misty Escape',
    monster: 'Vampire',
    version: '1.3.126',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};