import {automationUtils, documentUtils, summonUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'actionDismissal', 'activityId');
    if (activityId && activityId !== workflow.activity.id) return;
    const summon = automationUtils.getGenericConfigValue(document, 'chris-premades', 'actionDismissal', 'summon') ? summonUtils.getSummonData(workflow.actor) : undefined;
    if (summon) return await summonUtils.deleteSummon(summon);
    await documentUtils.deleteDocument(document);
}
/**
 * Deletes the item once it is used. With Dismiss Summon on, the summon that owns the item is dismissed instead.
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
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.ActionDismissal.ActivityId.Hint'
        },
        summon: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ActionDismissal.Summon.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ActionDismissal.Summon.Hint'
        }
    }
};
