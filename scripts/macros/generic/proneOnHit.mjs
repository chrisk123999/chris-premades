import {actorUtils} from '../../proxy.mjs';
async function late({workflow}) {
    await Promise.all(workflow.hitTargets.map(async token => {
        if (!token.actor) return;
        await actorUtils.applyConditions(token.actor, ['prone']);
    }));
}
export const proneOnHit = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ]
};
