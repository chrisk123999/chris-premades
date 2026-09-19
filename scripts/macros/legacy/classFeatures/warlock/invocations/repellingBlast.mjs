import {automationUtils, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function late({document, workflow}) {
    if (documentUtils.getIdentifier(workflow.activity) !== automationUtils.getConfigValue(document, 'activityIdentifier')) return;
    if (!workflow.hitTargets.size) return;
    const targetToken = workflow.hitTargets.first().document;
    const selection = await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    await workflowUtils.completeItemUse(document, [targetToken]);
    await tokenUtils.slideToken(targetToken, {sourceToken: workflow.token.document, distance: automationUtils.getConfigValue(document, 'distance')});
}
export const repellingBlast = {
    name: 'Eldritch Invocations: Repelling Blast',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        activityIdentifier: {
            default: 'eldritch-blast-beam',
            type: 'text',
            label: 'CHRISPREMADES.Config.Activity',
            category: 'homebrew'
        },
        distance: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        }
    }
};
