import {activityUtils, actorUtils, dialogUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../../utils.js';
async function attacked({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.token) return;
    if (!workflowUtils.isAttackType(workflow, 'attack') || actorUtils.hasUsedReaction(workflow.targets.first().actor) || !itemUtils.canUse(item)) return;
    let tookDamage = workflow.damageList.find(i => i.totalDamage);
    if (!tookDamage) return;
    let selection = await dialogUtils.confirmUseItem(item, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!activity) return;
    let activityData = genericUtils.duplicate(activity);
    activityData.damage.parts[0].bonus = tookDamage.totalDamage;
    await workflowUtils.syntheticActivityDataRoll(activityData, item, item.actor, [workflow.token], {consumeResources: true, consumeUsage: true});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'invokeHell');
}
export let punishment = {
    name: 'Invoke Hell: Punishment',
    version: '1.3.78',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'targetRollFinished',
                macro: attacked,
                priority: 100
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};