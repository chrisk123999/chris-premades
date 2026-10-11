import {automationUtils, documentUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'actionDismissal', 'activityId');
    if (activityId && activityId !== workflow.activity.id) return;
    await documentUtils.deleteDocument(document);
}
/**
 * Deletes the item once its roll finishes.
 * Bound on an item. Fires on `itemRollFinished`.
 *
 * Config:
 * - `activityId`: only delete when this activity is used. Blank deletes on any activity.
 */
export const actionDismissal = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['item'],
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
