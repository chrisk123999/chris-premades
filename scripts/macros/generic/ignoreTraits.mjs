import {automationUtils, constants, workflowUtils} from '../../proxy.mjs';
async function damage({document, workflow}) {
    if (!workflow.damageRolls?.length || !workflow.item) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'ignoreTraits', configKeys);
    if (config.itemTypes.length && !config.itemTypes.includes(workflow.item.type)) return;
    const rolledTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    const damageTypes = config.damageTypes.filter(damageType => rolledTypes.has(damageType));
    if (!damageTypes.length || !config.traits.length) return;
    const ignoreTraits = new Set(workflow.activity.midiProperties?.ignoreTraits ?? []);
    config.traits.forEach(trait => damageTypes.forEach(damageType => ignoreTraits.add(trait + '.' + damageType)));
    workflowUtils.setActivity(workflow, {midiProperties: {ignoreTraits: Array.from(ignoreTraits)}});
}
/**
 * Makes the owner's damage of the listed types ignore the listed damage traits.
 * Bound on an item or effect. Fires on `actorDamageRollComplete`.
 *
 * Config:
 * - `damageTypes`: damage types whose traits are ignored.
 * - `traits`: resistance, immunity, vulnerability or absorption to ignore, or immunity to downgrade to resistance.
 * - `itemTypes`: only items of these types. Empty allows every item.
 */
export const ignoreTraits = {
    rules: 'all',
    version: '2.1.9',
    category: 'utility',
    generic: true,
    documents: ['activeeffect', 'item'],
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 50
        }
    ],
    genericConfig: {
        damageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            hint: 'CHRISPREMADES.Macros.Generic.IgnoreTraits.DamageTypesHint',
            get options() { return constants.damageTypeOptions; }
        },
        traits: {
            default: ['idr'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.IgnoreTraits.Traits',
            hint: 'CHRISPREMADES.Macros.Generic.IgnoreTraits.TraitsHint',
            options: ['idr', 'idi', 'idv', 'ida', 'ddi'].map(value => ({value, label: 'midi-qol.SHARED.FIELDS.midiProperties.ignoreTraits.' + value + '.short'}))
        },
        itemTypes: {
            default: ['spell'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemTypeHint',
            get options() { return constants.usableItemTypes; }
        }
    }
};
const configKeys = Object.keys(ignoreTraits.genericConfig);
