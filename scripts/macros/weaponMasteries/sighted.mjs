import {dialogUtils, itemUtils, workflowUtils} from '../../proxy.mjs';
function attack({workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'rangedAttack')) return;
    workflowUtils.removeAttackDisadvantage(workflow, 'range');
}
async function damage({document: item, workflow}) {
    if (!workflow.longRangeAttack || !workflow.hitTargets.size || !workflow.damageRolls?.length) return;
    const max = workflow.damageRolls.reduce((total, roll) => total + roll.dice.reduce((count, die) => count + die.results.length, 0), 0);
    const selection = await dialogUtils.selectDie(workflow.damageRolls, itemUtils.getMasteryLabel('sighted'), _loc('CHRISPREMADES.WeaponMasteries.Sighted.Prompt'), {max});
    if (selection?.length) await workflowUtils.rerollDamageDice(workflow, selection, item);
}
export const sightedMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Sighted.Label',
    roll: [
        {pass: 'itemAttackRollConfig', macro: attack, priority: 50},
        {pass: 'itemDamageRollComplete', macro: damage, priority: 50}
    ]
};
