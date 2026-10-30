import {workflowUtils} from '../../proxy.mjs';
function attack({workflow}) {
    workflowUtils.expandAttackCriticalRange(workflow);
}
async function damage({document: item, workflow}) {
    if (!workflow.isCritical || !workflow.hitTargets.size || !workflow.damageRolls?.length) return;
    const denomination = item.system.damage.base.denomination;
    if (denomination) await workflowUtils.bonusDamage(workflow, '1d' + denomination, {ignoreCrit: true});
}
export const brutalMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Brutal.Label',
    roll: [
        {pass: 'itemAttackRollConfig', macro: attack, priority: 50},
        {pass: 'itemDamageRoll', macro: damage, priority: 50}
    ]
};
