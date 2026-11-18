import {DamageBonus, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function isPiercingHit(workflow) {
    return workflow.hitTargets.count && workflowUtils.isAttackType(workflow, 'attack') && workflowUtils.getDamageTypes(workflow.damageRolls ?? []).has('piercing');
}
async function critical({document: item, workflow}) {
    if (!workflow.isCritical || !isPiercingHit(workflow)) return;
    const faces = Math.max(0, ...workflow.damageRolls.filter(roll => roll.options.type === 'piercing').flatMap(roll => roll.dice.map(die => die.faces)));
    if (!faces) return;
    return new DamageBonus(item, {formula: '1d' + faces, type: 'piercing', optional: false, allowCritical: false});
}
async function reroll({document: item, workflow}) {
    if (!isPiercingHit(workflow) || !workflow.token) return;
    const combatData = tokenUtils.getCombatData(workflow.token.document);
    if (item.system.hasLimitedUses && !item.system.uses.value) return;
    const selection = await dialogUtils.selectDie(workflow.damageRolls, item.name, _loc('CHRISPREMADES.Macros.All.Piercer.Reroll'));
    if (!selection?.length) return;
    if (item.system.hasLimitedUses && combatData.inCombat) await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    await workflowUtils.rerollDamageDice(workflow, selection, item);
}
export const piercer = {
    name: 'Piercer',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: critical,
            priority: 250
        },
        {
            pass: 'actorDamageRollComplete',
            macro: reroll,
            priority: 350
        }
    ]
};
