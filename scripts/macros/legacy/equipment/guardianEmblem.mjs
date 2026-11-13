import {actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function protect({document: item, workflow}) {
    if (!workflow.isCritical || workflow.targets.count !== 1 || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!item.system.uses.value || !itemUtils.getEquipmentState(item)) return;
    const token = actorUtils.getFirstToken(item.actor);
    const target = workflow.targets.documents[0];
    if (!token || (token.inCombat && actorUtils.hasUsedReaction(item.actor))) return;
    if (token !== target && (!target.object || !tokenUtils.isWithinDistance(token, target, 30) || !tokenUtils.canSee(token, target))) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.GuardianEmblem.Protect', {item: item.name, name: target.name}), {userId})) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'protect');
    if (activity) await workflowUtils.syntheticActivityRoll(activity, [target], {consumeUsage: true, consumeResources: true, userId});
    if (token.inCombat) await actorUtils.setReactionUsed(item.actor);
    workflow.isCritical = false;
}
export const guardianEmblem = {
    name: 'Guardian Emblem',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'sceneAttackRollComplete',
            macro: protect,
            priority: 100
        }
    ]
};
