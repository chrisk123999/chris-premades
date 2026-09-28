import {actorUtils, dialogUtils, workflowUtils} from '../../../../proxy.mjs';
async function stun({document: activity, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    const ki = actorUtils.getItemByIdentifier(activity.actor, 'ki', {type: 'feat'});
    if (!ki?.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity, workflow.hitTargets.map(t => t.document));
}
export const stunningStrike = {
    name: 'Stunning Strike',
    version: '2.0.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: stun,
            priority: 200
        }
    ]
};
