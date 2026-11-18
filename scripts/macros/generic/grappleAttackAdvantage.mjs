import {automationUtils, constants, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function attack({document, macroClass: {identifier}, workflow}) {
    if (!workflow.token || !workflow.targets.count) return;
    const attackType = automationUtils.getGenericConfigValue(document, 'chris-premades', 'grappleAttackAdvantage', 'attackType');
    if (attackType && !workflowUtils.isAttackType(workflow, attackType)) return;
    const grappled = tokenUtils.getGrappled(workflow.token.document);
    if (!workflow.targets.documents.every(target => grappled.some(token => token.id === target.id))) return;
    workflow.tracker.advantage.add(identifier, document.name);
}
/**
 * Grants advantage on attack rolls against creatures grappled by the attacker.
 * Bound on an item or an effect. Fires on `actorAttackRollConfig`.
 *
 * Config:
 * - `attackType`: only grant advantage for this attack type.
 */
export const grappleAttackAdvantage = {
    rules: 'all',
    version: '2.1.9',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect', 'item'],
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        }
    ],
    genericConfig: {
        attackType: {
            default: 'attack',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.AttackTypeHint',
            get options() { return constants.attackTypeOptions; }
        }
    }
};
