import {activityUtils, actorUtils, dialogUtils, itemUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damaged({document: item, workflow}) {
    if (!workflow.token || !workflowUtils.isAttackType(workflow, 'attack') || actorUtils.hasUsedReaction(item.actor)) return;
    const dealt = workflow.damageList?.find(ditem => ditem.actorUuid === item.actor.uuid)?.totalDamage ?? 0;
    const activity = itemUtils.getActivityByIdentifier(item, 'punish');
    if (!dealt || !activity || !activityUtils.checkCosts(activity)) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    const activityData = activity.toObject();
    activityData.damage.parts[0].custom = {enabled: true, formula: String(dealt)};
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [workflow.token.document], {consumeResources: true});
}
export const invokeHellPunishment = {
    name: 'Invoke Hell: Punishment',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'targetRollFinished',
            macro: damaged,
            priority: 100
        }
    ]
};
