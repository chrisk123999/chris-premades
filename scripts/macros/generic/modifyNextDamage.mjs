import {automationUtils, constants, documentUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document: effect, workflow}) {
    if (!workflow.damageRolls?.length) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'modifyNextDamage', configKeys);
    if (config.itemTypes.length && !config.itemTypes.includes(workflow.item.type)) return;
    if (workflow.item.type === 'spell' && workflowUtils.getCastLevel(workflow) > config.maxSpellLevel) return;
    const rolls = config.mode === 'double' ? [...workflow.damageRolls, ...workflow.damageRolls.map(roll => roll.constructor.fromData(roll.toJSON()))] : await Promise.all(workflow.damageRolls.map(roll => roll.reroll({maximize: true})));
    await workflow.setDamageRolls(rolls);
    if (config.consume) await documentUtils.deleteDocument(effect);
}
/**
 * Maximizes or doubles the next damage roll made by the actor that has this effect.
 */
export const modifyNextDamage = {
    rules: 'all',
    version: '2.1.11',
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
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Mode.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Mode.Hint',
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
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.ItemTypes.Hint',
            get options() { return constants.usableItemTypes; }
        },
        maxSpellLevel: {
            default: 9,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.MaxSpellLevel.Hint'
        },
        consume: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Consume.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Consume.Hint'
        }
    }
};
const configKeys = Object.keys(modifyNextDamage.genericConfig);
