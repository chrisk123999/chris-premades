import {automationUtils, constants, dialogUtils, tokenUtils} from '../../proxy.mjs';
export function rememberCombat(token, document) {
    const scopeId = token ? tokenUtils.getCombatData(token.document ?? token).combatId : null;
    return scopeId ? {remember: 'combat', rememberKey: {scopeId, uuid: document.uuid}} : {};
}
export async function applyDamageType(workflow, type) {
    workflow.damageRolls.forEach(roll => roll.options.type = type);
    await workflow.setDamageRolls(workflow.damageRolls);
    workflow.defaultDamageType = type;
}
async function damageType({document: item, workflow}) {
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'selectDamageType', configKeys);
    const types = config.damageType.length ? config.damageType : Array.from(workflow.activity.damage?.parts?.[0]?.types ?? []);
    if (types.length < 2) return;
    const options = config.rememberChoice ? rememberCombat(workflow.token, item) : {};
    await applyDamageType(workflow, await dialogUtils.selectDamageType(types, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType', options) || types[0]);
}
/**
 * Prompts for a damage type and applies it to every damage roll.
 * Bound on an item. Fires on `itemDamageRoll`.
 * No prompt is shown when fewer than two types are available.
 *
 * Config:
 * - `damageType`: damage types offered. Leave empty to use the types of the activity's first damage part.
 * - `rememberChoice`: offer "Don't ask again this combat" on the prompt.
 */
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
            get options() { return constants.damageTypeOptions; }
        },
        rememberChoice: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SelectDamageType.RememberChoice',
            hint: 'CHRISPREMADES.Macros.Generic.SelectDamageType.RememberChoiceHint'
        }
    }
};
const configKeys = Object.keys(selectDamageType.genericConfig);
