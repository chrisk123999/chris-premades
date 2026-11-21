import {automationUtils, documentUtils, summonUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'actionDismissal', 'activityId');
    if (activityId && activityId !== workflow.activity.id) return;
    const summon = automationUtils.getGenericConfigValue(document, 'chris-premades', 'actionDismissal', 'summon') ? summonUtils.getSummonData(workflow.actor) : undefined;
    if (summon) return await summonUtils.deleteSummon(summon);
    await documentUtils.deleteDocument(document);
}
/**
 * Deletes the item once its roll finishes.
 * Bound on an item. Fires on `itemRollFinished`.
 *
 * Config:
 * - `activityId`: only delete when this activity is used. Blank deletes on any activity.
 * - `summon`: dismiss the summon that owns the item instead of deleting the item.
 */
export const actionDismissal = {
    rules: 'all',
    version: '2.1.11',
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
        },
        summon: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Generic.ActionDismissal.Summon',
            hint: 'CHRISPREMADES.Macros.Generic.ActionDismissal.SummonHint'
        }
    }
};
