import {activityUtils, combatUtils, dialogUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function lateSpeed({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflow.damageRolls || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('slashing')) return;
    if (!itemUtils.canUse(item)) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    let actiivty = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!actiivty) return;
    let inCombat = combatUtils.inCombat();
    await workflowUtils.syntheticActivityRoll(actiivty, Array.from(workflow.targets), {consumeUsage: inCombat, consumeResources: inCombat});
}
async function lateCrit({trigger: {entity: item}, workflow}) {
    if (!workflow.isCritical) return;
    if (workflow.hitTargets.size !== 1 || !workflow.damageRolls || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('slashing')) return;
    let actiivty = activityUtils.getActivityByIdentifier(item, 'critical', {strict: true});
    if (!actiivty) return;
    await workflowUtils.syntheticActivityRoll(actiivty, Array.from(workflow.targets));
}
export let slasher = {
    name: 'Slasher',
    version: '1.3.81',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateSpeed,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: lateCrit,
                priority: 55
            }
        ]
    }
};