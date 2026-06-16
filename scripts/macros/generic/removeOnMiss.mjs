import {documentUtils} from '../../proxy.mjs';
async function attack({document, workflow}) {
    if (workflow.targets.size !== 1) return;
    if (workflow.hitTargets.has(workflow.targets.first())) return;
    await documentUtils.deleteDocument(document);
}
export const removeOnMiss = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['ActiveEffect'],
    roll: [
        {
            pass: 'actorAttackRollComplete',
            macro: attack,
            priority: 100
        }
    ]
};
