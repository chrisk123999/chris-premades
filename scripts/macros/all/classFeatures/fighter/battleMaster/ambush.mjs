import {activityUtils, dialogUtils, documentUtils, effectUtils, workflowUtils} from '../../../../../proxy.mjs';
async function initiative({document: item, actor}) {
    const activity = item.system.activities.contents[0];
    const die = actor.flags['chris-premades']?.superiorityDie;
    if (!activity || !die || actor.statuses.has('incapacitated') || !activityUtils.checkCosts(activity)) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    await workflowUtils.completeActivityUse(activity, [], {fast: true});
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: item.name,
        img: item.img,
        origin: activity.uuid,
        duration: {value: 1, units: 'seconds', expiry: 'combatStart'},
        changes: [{key: 'system.attributes.init.roll.bonus', type: 'add', value: die, phase: 'initial', priority: 20}],
        specialDuration: ['isInitiative']
    });
    await effectUtils.createEffects(actor, [effectData]);
}
export const ambush = {
    name: 'Maneuvers: Ambush',
    version: '2.1.9',
    rules: 'all',
    combat: [
        {
            pass: 'actorPreInitiative',
            macro: initiative,
            priority: 200
        }
    ]
};
