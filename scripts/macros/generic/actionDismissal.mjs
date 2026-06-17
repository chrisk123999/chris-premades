import {automationUtils, documentUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'actionDismissal', 'activityId');
    if (activityId && activityId !== workflow.activity.id) return;
    await documentUtils.deleteDocument(document);
}
export const actionDismissal = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['Item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.Activity',
            hint: ''
        }
    }
};
