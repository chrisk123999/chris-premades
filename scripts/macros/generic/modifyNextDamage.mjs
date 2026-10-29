import {automationUtils, constants, documentUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document: effect, workflow}) {
    if (!workflow.damageRolls?.length) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'modifyNextDamage', configKeys);
    if (config.itemTypes.length && !config.itemTypes.includes(workflow.item.type)) return;
    if (workflow.item.type === 'spell' && workflowUtils.getCastLevel(workflow) > config.maxSpellLevel) return;
    const rolls = config.mode === 'double' ? [...workflow.damageRolls, ...workflow.damageRolls] : await Promise.all(workflow.damageRolls.map(roll => roll.reroll({maximize: true})));
    await workflow.setDamageRolls(rolls);
    if (config.consume) await documentUtils.deleteDocument(effect);
}
/**
 * Maximizes or doubles the bearer's next damage roll.
 * Bound on an effect. Fires on `actorDamageRollComplete`.
 *
 * Config:
 * - `mode`: maximize every die, or count every damage roll twice.
 * - `itemTypes`: only rolls from these item types. Empty allows any.
 * - `maxSpellLevel`: spells cast above this level are skipped.
 * - `consume`: delete the effect once it modifies a roll.
 */
export const modifyNextDamage = {
    rules: 'all',
    version: '2.1.5',
    category: 'damage',
    generic: true,
    documents: ['activeeffect'],
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 450
        }
    ],
    genericConfig: {
        mode: {
            default: 'maximize',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Mode',
            options: [
                {value: 'maximize', label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Maximize'},
                {value: 'double', label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Double'}
            ]
        },
        itemTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            get options() { return constants.usableItemTypes; }
        },
        maxSpellLevel: {
            default: 9,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSpellLevel'
        },
        consume: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Consume'
        }
    }
};
const configKeys = Object.keys(modifyNextDamage.genericConfig);
