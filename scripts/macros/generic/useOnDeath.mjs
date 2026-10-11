import {workflowUtils} from '../../proxy.mjs';
async function use({document, effect}) {
    if (!effect.statuses.has('dead')) return;
    if (document.system.equipped === false) return;
    await workflowUtils.completeItemUse(document);
}
/**
 * Uses this item when its owner gains the dead status.
 * Bound on an item. Fires on `actorCreated`.
 * Unequipped items are skipped.
 */
export const useOnDeath = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['item'],
    effect: [
        {
            pass: 'actorCreated',
            macro: use,
            priority: 50
        }
    ]
};
