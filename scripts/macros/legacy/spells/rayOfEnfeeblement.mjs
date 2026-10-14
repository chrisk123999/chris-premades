import {automationUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document, workflow}) {
    if (!workflow.damageRolls?.length || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (workflow.activity.ability !== 'str') return;
    const damageRolls = workflow.damageRolls.map(roll => rollUtils.setTotalWithBonus(roll, Math.floor(roll.total * automationUtils.getOriginConfigValue(document, 'damageMultiplier'))));
    await workflow.setDamageRolls(damageRolls);
}
export const rayOfEnfeeblement = {
    name: 'Ray of Enfeeblement',
    version: '2.1.3',
    rules: '2014',
    config: {
        damageMultiplier: {
            default: 0.5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Multiplier',
            category: 'homebrew'
        }
    }
};
export const rayOfEnfeeblementEnfeebled = {
    name: 'Ray of Enfeeblement: Enfeebled',
    version: rayOfEnfeeblement.version,
    rules: rayOfEnfeeblement.rules,
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 50
        }
    ]
};
