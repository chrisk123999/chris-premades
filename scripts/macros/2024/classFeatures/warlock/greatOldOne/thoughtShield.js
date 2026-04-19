import {activityUtils, socketUtils, workflowUtils} from '../../../../../utils.js';
async function damaged({trigger: {entity: item}, workflow, ditem}) {
    if (!ditem.isHit) return;
    const damage = ditem.damageDetail.reduce((t, dmg) => t + (dmg.type === 'psychic' ? dmg.value : 0), 0);
    if (!damage) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'damage', {strict: true});
    if (!activity) return;
    activity = activityUtils.withChangedDamage(activity, damage, ['none']);
    await workflowUtils.syntheticActivityDataRoll(activity, item, item.parent, [workflow.token], {options: {asUser: socketUtils.firstOwner(item.parent, true)}});
}
export let thoughtShield = {
    name: 'Thought Shield',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damaged,
                priority: 200
            }
        ]
    }
};
