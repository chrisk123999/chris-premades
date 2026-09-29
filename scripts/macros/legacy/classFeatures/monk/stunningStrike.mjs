import {actorUtils, dialogUtils, workflowUtils} from '../../../../proxy.mjs';
async function stun({document: activity, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    const valid = workflow.hitTargets.filter(t => {
        if (t.actor.system.attributes.hp.value <= 0) return;
        if (actorUtils.getEffectByIdentifier(t.actor, 'stunning-strike')) return;
        return true;
    });
    if (!valid.size) return;
    const ki = actorUtils.getItemByIdentifier(activity.actor, 'ki', {type: 'feat'});
    if (!ki?.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity, valid.map(t => t.document));
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
