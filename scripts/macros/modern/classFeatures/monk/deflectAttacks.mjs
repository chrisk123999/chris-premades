import {actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function deflect({document: activity, ditem, targetToken, workflow}) {
    if (ditem.newHP === ditem.oldHP || !ditem.isHit) return;
    if (actorUtils.hasUsedReaction(activity.actor)) return;
    const deflectEnergy = actorUtils.getItemByIdentifier(activity.actor, 'deflect-energy', {type: 'feat'});
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!deflectEnergy) {
        damageTypes = new Set(['bludgeoning', 'piercing', 'slashing']).intersection(damageTypes);
        if (!damageTypes.size) return;
    }
    const userId = queryUtils.firstOwner(activity.actor, true);
    if (!await dialogUtils.confirmUseItem(activity.item, {userId})) return;
    const reduction = (await workflowUtils.syntheticActivityRoll(activity, [targetToken], {userId}))?.utilityRoll.total;
    if (!reduction) return;
    workflowUtils.modifyDamageAppliedFlat(ditem, -reduction);
    if (ditem.newHP != ditem.oldHP) return;
    const monksFocus = actorUtils.getItemByIdentifier(activity.actor, 'monks-focus', {type: 'feat'});
    if (!monksFocus?.system.uses.value) return;
    const range = workflowUtils.isAttackType(workflow, 'meleeAttack') ? 5 : 60;
    const nearby = tokenUtils.findNearby(targetToken, range);
    if (!nearby.length) return;
    const selection = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.DeflectAttacks', nearby, {skipDeadAndUnconscious: false, userId, buttons: 'yesNo'});
    if (!selection?.result) return;
    const deflectActivity = itemUtils.getActivityByIdentifier(activity.item, 'save');
    if (!deflectActivity) return;
    const activityData = deflectActivity.toObject();
    activityData.damage.parts[0].types = [workflow.defaultDamageType];
    await workflowUtils.syntheticActivityDataRoll(activityData, activity.item, [selection.result], {userId});
}
export const deflectAttacks = {
    name: 'Deflect Attacks',
    version: '2.0.4',
    rules: '2024',
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: deflect,
            priority: 200
        }
    ]
};
