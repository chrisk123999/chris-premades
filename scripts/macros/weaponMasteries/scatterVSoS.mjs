import {workflowUtils} from '../../proxy.mjs';
function attack({workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'rangedAttack')) return;
    workflowUtils.removeAttackDisadvantage(workflow, 'nearbyFoe');
}
export const scatterVSoSMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.ScatterVSoS.Label',
    roll: [
        {pass: 'itemAttackRollConfig', macro: attack, priority: 50}
    ]
};
