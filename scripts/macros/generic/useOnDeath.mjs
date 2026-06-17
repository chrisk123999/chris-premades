import {workflowUtils} from '../../proxy.mjs';
async function use({document, effect}) {
    if (!effect.statuses.has('dead')) return;
    if (document.system.equipped === false) return;
    await workflowUtils.completeItemUse(document);
}
export const useOnDeath = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['Item'],
    effect: [
        {
            pass: 'actorCreated',
            macro: use,
            priority: 50
        }
    ]
};
