import {actorUtils, dialogUtils, documentUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function fall({document: activity, ditem, targetToken, workflow}) {
    if (ditem.newHP === ditem.oldHP || !ditem.isHit) return;
    if (actorUtils.hasUsedReaction(activity.actor)) return;
    if (documentUtils.getIdentifier(workflow.item) !== 'fall') return;
    const userId = queryUtils.firstOwner(activity.actor, true);
    if (!await dialogUtils.confirmUseItem(activity.item, {userId})) return;
    const reduction = (await workflowUtils.syntheticActivityRoll(activity, [targetToken], {userId}))?.utilityRoll.total;
    if (!reduction) return;
    workflowUtils.modifyDamageAppliedFlat(ditem, -reduction);
}
export const slowFall = {
    name: 'Slow Fall',
    version: '2.0.4',
    rules: 'all',
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: fall,
            priority: 200
        }
    ]
};
