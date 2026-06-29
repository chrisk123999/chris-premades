import {documentUtils} from '../../proxy.mjs';
async function remove({document}) {
    await documentUtils.deleteDocument(document);
}
export const removeRegion = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['activeeffect'],
    combat: [
        {
            pass: 'actorEveryTurn',
            macro: remove,
            priority: 250
        }
    ]
};
