import {dialogUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function sweep({document: item, data: {activity, riderWorkflow, workflow}}) {
    if (activity.item !== item || !workflow.token) return;
    const source = workflow.token.document;
    const original = workflow.hitTargets.documents[0];
    if (!original) return;
    const reach = itemUtils.getRange(workflow.item).reach || 5;
    const candidates = tokenUtils.findNearby(original, 5).filter(other => other.actor && other !== source && tokenUtils.isWithinDistance(source, other, reach));
    if (!candidates.length) return;
    const target = candidates.length > 1 ? (await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Legacy.Maneuvers.SweepingSelect', candidates))?.result : candidates[0];
    if (!target || workflow.attackTotal < target.actor.system.attributes.ac.value) return;
    const amount = rollUtils.getRollsTotal(riderWorkflow.utilityRolls ?? []);
    if (amount > 0) await workflowUtils.applyDamage([target], amount, workflow.damageRolls?.[0]?.options.type ?? workflow.defaultDamageType);
}
export const sweepingAttack = {
    name: 'Maneuvers: Sweeping Attack',
    version: '2.1.9',
    rules: 'all',
    called: [
        {
            pass: 'actorAttackRiderUsed',
            macro: sweep,
            priority: 50
        }
    ]
};
