import {automationUtils, effectUtils} from '../../proxy.mjs';
const unaffected = {
    failedSave: workflow => !workflow.failedSaves.count,
    noTargets: workflow => !workflow.targets.count,
    noHits: workflow => !workflow.hitTargets.count
};
async function rollFinished({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'endIfUnaffected', configKeys);
    if (config.activityId && config.activityId !== workflow.activity.id) return;
    if (!unaffected[config.condition]?.(workflow)) return;
    await effectUtils.endConcentration(workflow.actor, workflow.item);
}
/**
 * Ends the caster's concentration on this item when a use leaves no creature affected.
 */
export const endIfUnaffected = {
    rules: 'all',
    version: '2.0.0',
    category: 'mechanics',
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
            label: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.Condition.Label',
            hint: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.Condition.Hint',
            get options() { return Object.keys(unaffected).map(value => ({value, label: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.ConditionOptions.' + value})); }
        },
        activityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.EndIfUnaffected.Activity.Hint'
        }
    }
};
const configKeys = Object.keys(endIfUnaffected.genericConfig);
