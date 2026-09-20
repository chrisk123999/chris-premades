import {combatUtils, dialogUtils, documentUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damage({document, workflow}) {
    if (!workflow.hitTargets.size || !document.system.uses.value) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.isOwnTurn(workflow.token.document)) return;
    const selection = await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    await workflowUtils.completeItemUse(document, [workflow.token.document]);
    const rolls = await Promise.all(workflow.damageRolls.map(async roll => await rollUtils.getChangedDamageRoll(roll, 'necrotic')));
    await workflow.setDamageRolls(rolls);
    if (!documentUtils.getEffectByIdentifier(workflow.actor, 'formOfDreadActive')) return;
    await workflowUtils.bonusDamage(workflow, '1d' + rolls[0].dice[0].faces, {damageType: 'necrotic'});
}
export const graveTouched = {
    name: 'Grave Touched',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorDamageRollComplete', macro: damage, priority: 500}
    ]
};
