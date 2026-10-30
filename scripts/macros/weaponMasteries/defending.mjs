import {actorUtils, dialogUtils, itemUtils, queryUtils, rollUtils, workflowUtils} from '../../proxy.mjs';
async function attacked({document: item, workflow, sourceToken}) {
    const actor = sourceToken?.actor;
    if (!actor || !item.system.equipped || !workflow.attackRoll || !workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    if (actorUtils.hasUsedReaction(actor) || workflow.attackTotal < actor.system.attributes.ac.value) return;
    const label = itemUtils.getMasteryLabel('defending');
    if (!await dialogUtils.confirm(label, _loc('CHRISPREMADES.WeaponMasteries.Defending.Prompt', {weapon: item.name}), {userId: queryUtils.firstOwner(actor, true)})) return;
    await actorUtils.setReactionUsed(actor);
    const {roll} = await rollUtils.rollDice('1d4', {document: actor, message: true, flavor: label, speaker: ChatMessage.implementation.getSpeaker({actor}), manual: true});
    workflowUtils.addTargetAC(workflow, actor, roll.total);
}
export const defendingMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Defending.Label',
    roll: [
        {pass: 'targetAttackRoll', macro: attacked, priority: 50, unique: 'masteryDefending'}
    ]
};
