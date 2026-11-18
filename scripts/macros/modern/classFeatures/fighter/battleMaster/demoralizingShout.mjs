import {actorUtils, documentUtils, effectUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damage({document: effect, workflow}) {
    if (!workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    const fighter = effectUtils.getOriginActivitySync(effect)?.actor;
    const die = fighter?.flags['chris-premades']?.superiorityDie;
    if (!die) return;
    const fighterToken = actorUtils.getFirstToken(fighter);
    if (workflow.hitTargets.documents.every(target => target === fighterToken)) return;
    await workflowUtils.bonusDamage(workflow, '-' + die, {ignoreCrit: true, source: effect.name});
    await documentUtils.deleteDocument(effect);
}
export const demoralizingShout = {
    name: 'Maneuvers: Demoralizing Shout',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorDamageRollBonuses',
            macro: damage,
            priority: 250
        }
    ]
};
