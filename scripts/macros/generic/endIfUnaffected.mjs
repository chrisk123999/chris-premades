import {automationUtils, effectUtils} from '../../proxy.mjs';
const unaffected = {
    failedSave: workflow => !workflow.failedSaves.size,
    noTargets: workflow => !workflow.targets.size,
    noHits: workflow => !workflow.hitTargets.size
};
async function rollFinished({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'endIfUnaffected', configKeys);
    if (config.activityId && config.activityId !== workflow.activity.id) return;
    if (!unaffected[config.condition]?.(workflow)) return;
    await effectUtils.endConcentration(workflow.actor, workflow.item);
}
/**
 * Ends concentration on the spell when the roll left no creature affected.
 * Bound on an item or an activity. Fires on `itemRollFinished` and `activityRollFinished`.
 *
 * Config:
 * - `condition`: what counts as unaffected. No failed saves, no targets, or no hits.
 * - `activityId`: only check uses of this activity. Empty checks every activity.
 */
export const endIfUnaffected = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['item', 'activity'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: rollFinished,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: rollFinished,
            priority: 50
        }
    ],
    genericConfig: {
        condition: {
            default: 'failedSave',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.Condition',
            hint: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.ConditionHint',
            get options() { return Object.keys(unaffected).map(value => ({value, label: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.ConditionOptions.' + value})); }
        },
        activityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.ActivityHint'
        }
    }
};
const configKeys = Object.keys(endIfUnaffected.genericConfig);
