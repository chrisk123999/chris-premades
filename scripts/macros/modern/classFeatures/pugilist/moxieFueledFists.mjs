import {automationUtils, dialogUtils, documentUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
import {applyDamageType} from '../../../generic/selectDamageType.mjs';
async function early({document: item, workflow}) {
    const unarmed = ['unarmed', 'improv'].includes(workflow.item.system.type?.value) || documentUtils.getIdentifier(workflow.item) === 'unarmed-strike';
    if (!unarmed || !workflow.activity?.hasAttack) return;
    if (!automationUtils.getConfigValue(item, 'autoApply') && !await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.Modern.MoxieFueledFists.Force', {userId: queryUtils.firstOwner(workflow.actor, true)})) return;
    workflowUtils.setWorkflowProperty(workflow, 'moxieFueledFists', true);
}
async function damage({workflow}) {
    if (workflow.damageRolls?.length && workflowUtils.getWorkflowProperty(workflow, 'moxieFueledFists')) await applyDamageType(workflow, 'force');
}
export const moxieFueledFists = {
    name: 'Moxie-Fueled Fists',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: early,
            priority: 50
        },
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 45
        }
    ],
    config: {
        autoApply: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.MoxieFueledFists.AutoApply',
            category: 'behavior'
        }
    }
};
