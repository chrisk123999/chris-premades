import {actorUtils, dialogUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function hit({document: item, workflow}) {
    if (!workflow.activity?.hasAttack || workflow.actor === item.actor || workflow.hitTargets.count !== 1) return;
    const target = workflow.hitTargets.documents[0];
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || target === owner || owner.parent !== target.parent || actorUtils.hasUsedReaction(item.actor)) return;
    if (item.actor.statuses.has('incapacitated') || !tokenUtils.isWithinDistance(owner, target, 5)) return;
    const activity = item.system.activities.contents[0];
    if (!activity) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await workflowUtils.completeActivityUse(activity, [target]);
}
export const opportunist = {
    name: 'Opportunist',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'sceneRollFinished',
            macro: hit,
            priority: 50
        }
    ]
};
