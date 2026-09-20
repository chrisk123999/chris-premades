import {automationUtils, combatUtils, dialogUtils, documentUtils, workflowUtils} from '../../../../../proxy.mjs';
async function late({document, workflow}) {
    if (!workflow.hitTargets.size || !document.system.uses.value || !workflow.token) return;
    if (documentUtils.getIdentifier(workflow.activity) !== automationUtils.getConfigValue(document, 'activityIdentifier')) return;
    if (!combatUtils.isOwnTurn(workflow.token.document)) return;
    const targetToken = workflow.hitTargets.first().document;
    const selection = await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    await workflowUtils.completeItemUse(document, [targetToken]);
}
export const lanceOfLethargy = {
    name: 'Eldritch Invocations: Lance of Lethargy',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 450
        }
    ],
    config: {
        activityIdentifier: {
            default: 'eldritch-blast-beam',
            type: 'text',
            label: 'CHRISPREMADES.Config.Activity',
            category: 'homebrew'
        }
    }
};
