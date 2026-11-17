import {activityUtils, actorUtils, dialogUtils, itemUtils, Logging, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document: item, workflow}) {
    if (!workflow.hitTargets.count || !workflow.damageRolls?.length) return;
    if (!workflowUtils.isAttackType(workflow, 'attack') || !actorUtils.isBloodied(workflow.actor)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'defiant-strike');
    if (!activity) return Logging.addMacroWarning('CPR', 'i-fought-i-lived', 'Missing the defiant-strike activity.', {notify: 'warn'});
    if (!activityUtils.checkCosts(activity)) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    const rolls = await Promise.all(workflow.damageRolls.map(rollUtils.maximizeRoll));
    await workflow.setDamageRolls(rolls);
    await workflowUtils.completeActivityUse(activity);
}
export const iFoughtILived = {
    name: 'I Fought, I Lived',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 300
        }
    ]
};
