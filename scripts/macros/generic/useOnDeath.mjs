import {workflowUtils} from '../../proxy.mjs';
async function use({document}) {
    if (document.system.equipped === false) return;
    await workflowUtils.completeItemUse(document);
}
export const useOnDeath = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['Item'],
    death: [
        {
            pass: 'actorDead',
            macro: use,
            priority: 50
        }
    ]
};
