import {actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function attack({document: item, workflow, hitData}) {
    if (!workflow.attackRoll || workflow.targets.count !== 1 || !workflow.token || !hitData.isHit) return;
    const target = hitData.target;
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || !target.actor || target.actor === item.actor || workflow.actor === item.actor || workflow.token.document.disposition === owner.disposition) return;
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor) || item.actor.statuses.has('incapacitated')) return;
    if (!tokenUtils.isWithinDistance(owner, target, 60) || !tokenUtils.canSee(owner, target)) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.queuedConfirmDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.RunicShield.Use', {item: item.name, name: target.name}), {userId})) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'use') ?? item.system.activities.contents[0];
    await workflowUtils.completeActivityUse(activity, [workflow.token.document], {userId});
    const newRoll = await workflow.attackRoll.reroll();
    if (!newRoll) return;
    await workflow.setAttackRoll(newRoll);
    const hit = workflow.isCritical || (!workflow.isFumble && newRoll.total >= hitData.ac);
    workflowUtils.changeHit(workflow, hitData, hit, {document: item});
}
export const runicShield = {
    name: 'Runic Shield',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'sceneChangeHit',
            macro: attack,
            priority: 50
        }
    ]
};
