import {automationUtils, documentUtils, effectUtils, rollUtils} from '../../proxy.mjs';
async function created({document: effect}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'rolledDuration', configKeys);
    const {roll} = await rollUtils.rollDice(config.formula, {document: effectUtils.getActor(effect), message: true, flavor: effect.name});
    if (!roll) return;
    await documentUtils.update(effect, {duration: {value: roll.total, units: config.units + 's'}});
}
/**
 * Rolls the effect's duration when the effect is created and posts the roll to chat.
 */
export const rolledDuration = {
    rules: 'all',
    version: '2.1.5',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect'],
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 40
        }
    ],
    genericConfig: {
        formula: {
            default: '1d4',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Generic.RolledDuration.Formula.Hint'
        },
        units: {
            default: 'hour',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RolledDuration.Units.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RolledDuration.Units.Hint',
            get options() { return ['round', 'minute', 'hour', 'day'].map(value => ({value, label: CONFIG.DND5E.timePeriods[value]})); }
        }
    }
};
const configKeys = Object.keys(rolledDuration.genericConfig);
