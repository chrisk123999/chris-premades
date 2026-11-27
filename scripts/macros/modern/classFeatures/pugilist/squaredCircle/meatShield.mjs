import {activityUtils, actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function grappled(item) {
    const token = actorUtils.getFirstToken(item.actor);
    return token ? tokenUtils.getGrappled(token) : [];
}
function cover({document: item, workflow, hitData}) {
    const targets = grappled(item);
    if (!targets.length || targets.some(token => token === workflow.token?.document)) return;
    workflowUtils.bonusAC(workflow, hitData, 2, {document: item});
}
async function missed({document: item, workflow}) {
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || !workflow.token || workflow.hitTargets.documents.includes(owner)) return;
    const targets = grappled(item);
    if (!targets.length || targets.includes(workflow.token.document) || actorUtils.hasUsedReaction(item.actor)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'use');
    if (!activity || !activityUtils.checkCosts(activity)) return;
    const range = Number(workflow.activity.range?.reach ?? workflow.activity.range?.value ?? 5) || 5;
    const inRange = targets.filter(token => tokenUtils.isWithinDistance(workflow.token.document, token, range));
    if (!inRange.length) return;
    const target = (await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Modern.MeatShield.Redirect', inRange, {userId: queryUtils.firstOwner(item.actor, true), buttons: 'yesNo', skipDeadAndUnconscious: false}))?.result;
    if (!target) return;
    if (!await workflowUtils.completeActivityUse(activity, [target])) return;
    await workflowUtils.syntheticActivityRoll(workflow.activity, [target]);
}
export const meatShield = {
    name: 'Meat Shield',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'targetBonusAC',
            macro: cover,
            priority: 50
        },
        {
            pass: 'targetAttackRollComplete',
            macro: missed,
            priority: 50
        }
    ]
};
