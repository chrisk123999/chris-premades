import {activityUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'move', {strict: true});
    if (!activity) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    await effectUtils.createEffect(workflow.actor, effectData, {
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['move'],
            favorite: true
        },
        rules: 'legacy',
        vae: [
            {
                type: 'use',
                name: activity.name,
                identifier: 'shiftSwiftstride',
                activityIdentifier: 'move'
            }
        ]
    });
}
export let shiftSwiftstride = {
    name: 'Shifting: Swiftstride',
    version: '1.1.42',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    }
};