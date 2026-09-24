import {automationUtils, constants, dialogUtils} from '../../proxy.mjs';
async function damageType({document: item, workflow}) {
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'selectDamageType', configKeys);
    const types = config.damageType.length ? config.damageType : Array.from(workflow.activity.damage?.parts?.[0]?.types ?? []);
    if (types.length < 2) return;
    const selection = await dialogUtils.selectDamageType(types, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType') || types[0];
    workflow.damageRolls.forEach(roll => roll.options.type = selection);
    await workflow.setDamageRolls(workflow.damageRolls);
    workflow.defaultDamageType = selection;
}
export const selectDamageType = {
    rules: 'all',
    version: '2.0.0',
    category: 'damage',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemDamageRoll',
            macro: damageType,
            priority: 50
        }
    ],
    genericConfig: {
        damageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.SelectDamageType.DamageTypeHint',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
const configKeys = Object.keys(selectDamageType.genericConfig);
