import {actorUtils, dialogUtils, documentUtils, itemUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function hit({document: item, workflow}) {
    if (workflow.hitTargets.count !== 1 || !workflow.token || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls ?? []).has('bludgeoning')) return;
    const target = workflow.hitTargets.documents[0];
    if (!target.actor) return;
    if (workflow.isCritical) {
        const activity = itemUtils.getActivityByIdentifier(item, 'crusher-critical');
        if (activity) await workflowUtils.completeActivityUse(activity, [target]);
    }
    if (actorUtils.getSize(target.actor) > actorUtils.getSize(workflow.actor) + 1) return;
    const combatData = tokenUtils.getCombatData(workflow.token.document);
    if (item.system.hasLimitedUses && !item.system.uses.value) return;
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.Crusher.Move', {target: target.name}))) return;
    if (item.system.hasLimitedUses && combatData.inCombat) await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    await tokenUtils.displaceToken(target, {sourceToken: workflow.token.document, range: 5});
}
export const crusher = {
    name: 'Crusher',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: hit,
            priority: 50
        }
    ]
};
