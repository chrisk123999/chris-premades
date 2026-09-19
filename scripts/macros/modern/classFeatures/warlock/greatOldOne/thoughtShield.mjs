import {activityUtils, automationUtils, constants, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damaged({document, workflow, ditem}) {
    if (!ditem.isHit) return;
    const damageType = automationUtils.getConfigValue(document, 'damageType');
    const damage = ditem.damageDetail.reduce((total, entry) => total + (entry.type === damageType ? entry.value : 0), 0);
    if (!damage) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'damage');
    if (!activity) return;
    const activityData = activityUtils.getDamageModifiedActivityData(activity, damage);
    await workflowUtils.syntheticActivityDataRoll(activityData, document, [workflow.token.document]);
}
export const thoughtShield = {
    name: 'Thought Shield',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'targetDamageComplete', macro: damaged, priority: 200}
    ],
    config: {
        damageType: {
            default: 'psychic',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
