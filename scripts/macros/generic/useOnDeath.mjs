import {automationUtils, constants, dialogUtils, queryUtils, workflowUtils} from '../../proxy.mjs';
const pending = new Set();
async function use({document, effect}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'useOnDeath', configKeys);
    if (!config.statuses.some(status => effect.statuses.has(status))) return;
    if (document.system.equipped === false || pending.has(document.uuid)) return;
    if (document.system.uses?.max && !document.system.uses.value) return;
    pending.add(document.uuid);
    try {
        if (config.confirm && !await dialogUtils.confirmUseItem(document, {userId: queryUtils.firstOwner(document.actor, true)})) return;
        await workflowUtils.completeItemUse(document, [], {options: {workflowOptions: {allowIncapacitated: true}}});
    } finally {
        pending.delete(document.uuid);
    }
}
/**
 * Uses this item when its owner gains one of the chosen statuses.
 * Unequipped items and items with no uses left are skipped.
 */
export const useOnDeath = {
    rules: 'all',
    version: '2.1.11',
    category: 'uses',
    generic: true,
    documents: ['item'],
    effect: [
        {
            pass: 'actorCreated',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        statuses: {
            default: ['dead'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnDeath.Statuses.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnDeath.Statuses.Hint',
            get options() { return constants.statusOptions; }
        },
        confirm: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnDeath.Confirm.Hint'
        }
    }
};
const configKeys = Object.keys(useOnDeath.genericConfig);
