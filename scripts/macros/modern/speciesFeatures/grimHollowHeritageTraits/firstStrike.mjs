import {automationUtils, DamageBonus, workflowUtils} from '../../../../proxy.mjs';
async function bonus({workflow, document}) {
    if (workflow.hitTargets.size != 1 || !workflow.item || !workflow.activity || !document.system.uses.value) return;
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.token.document.inCombat) return;
    const sourceCombatant = workflow.token.document.combatant;
    const targetCombatant = workflow.hitTargets.first().document.combatant;
    if (!targetCombatant || sourceCombatant.combat.round != 1) return;
    if (sourceCombatant.combat.turns.indexOf(sourceCombatant) >= sourceCombatant.combat.turns.indexOf(targetCombatant)) return;
    const formula = automationUtils.getConfigValue(document, 'formula');
    return new DamageBonus(document, {action: 'special', formula}).withDefaultOnUse();
}
export const firstStrike = {
    name: 'First Strike',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: bonus,
            priority: 250
        }
    ],
    config: {
        formula: {
            default: '2d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior',
            hint: ''
        }
    }
};