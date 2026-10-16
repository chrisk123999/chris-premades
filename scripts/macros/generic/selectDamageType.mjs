import {automationUtils, constants, dialogUtils, documentUtils, tokenUtils} from '../../proxy.mjs';
export function rememberCombat(token, document) {
    const scopeId = token ? tokenUtils.getCombatData(token.document ?? token).combatId : null;
    return scopeId ? {remember: 'combat', rememberKey: {scopeId, uuid: document.uuid}} : {};
}
export async function applyDamageType(workflow, type) {
    workflow.damageRolls.forEach(roll => roll.options.type = type);
    await workflow.setDamageRolls(workflow.damageRolls);
    workflow.defaultDamageType = type;
}
// The damage type chosen when the spell was cast, if the item chooses at casting.
export function getCastDamageType(item) {
    return item?.flags['chris-premades']?.selectedDamageType;
}
async function cast({document: item, workflow}) {
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'selectDamageType', configKeys);
    if (!config.atCast || workflow.activity.id !== item.system.activities.contents[0]?.id || config.damageType.length < 2) return;
    const type = await dialogUtils.selectDamageType(config.damageType, item.name, 'CHRISPREMADES.Generic.SelectDamageType') || config.damageType[0];
    await documentUtils.setFlag(item, 'chris-premades', 'selectedDamageType', type);
}
async function damageType({document: item, workflow}) {
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', 'selectDamageType', configKeys);
    const types = config.damageType.length ? config.damageType : Array.from(workflow.activity.damage?.parts?.[0]?.types ?? []);
    if (types.length < 2) return;
    if (config.atCast) {
        const chosen = getCastDamageType(item);
        if (types.includes(chosen)) return applyDamageType(workflow, chosen);
    }
    const options = config.rememberChoice ? rememberCombat(workflow.token, item) : {};
    await applyDamageType(workflow, await dialogUtils.selectDamageType(types, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType', options) || types[0]);
}
/**
 * Prompts for a damage type and applies it to every damage roll. With `atCast`, the choice is made once when the spell is cast.
 * Bound on an item. Fires on `itemPreambleComplete` and `itemDamageRoll`.
 * No prompt is shown when fewer than two types are available.
 *
 * Config:
 * - `damageType`: damage types offered. Leave empty to use the types of the activity's first damage part.
 * - `rememberChoice`: offer "Don't ask again this combat" on the prompt.
 * - `atCast`: choose when the item's first activity is used and reuse that type for every later damage roll.
 */
export const selectDamageType = {
    rules: 'all',
    version: '2.0.0',
    category: 'damage',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: cast,
            priority: 45
        },
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
        },
        atCast: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SelectDamageType.AtCast',
            hint: 'CHRISPREMADES.Macros.Generic.SelectDamageType.AtCastHint'
        }
    }
};
const configKeys = Object.keys(selectDamageType.genericConfig);
