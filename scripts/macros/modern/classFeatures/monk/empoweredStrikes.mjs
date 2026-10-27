import {automationUtils, dialogUtils, documentUtils, workflowUtils} from '../../../../proxy.mjs';
async function attack({document, workflow}) {
    if (!workflow.item) return;
    const identifier = documentUtils.getIdentifier(workflow.item);
    if (identifier !== 'unarmed-strike') return;
    if (workflow.activity?.type !== 'attack') return;
    const autoApply = automationUtils.getConfigValue(document, 'autoApply');
    if (!autoApply) {
        const selection = await dialogUtils.confirmUseItem(document);
        if (!selection) return;
    }
    workflowUtils.setWorkflowProperty(workflow, 'empoweredStrikes', true);
}
async function damage({workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'empoweredStrikes') || !workflow.damageRolls?.length) return;
    workflow.damageRolls[0].options.type = 'force';
    await workflow.setDamageRolls(workflow.damageRolls);
}
export const empoweredStrikes = {
    name: 'Empowered Strikes',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: attack,
            priority: 40
        },
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 40
        }
    ],
    config: {
        autoApply: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.AutoApply',
            category: 'mechanics'
        }
    }
};
