import {actorUtils} from '../../proxy.mjs';
async function fail({workflow}) {
    await Promise.all(workflow.failedSaves.map(async token => {
        if (!token.actor) return;
        await actorUtils.applyConditions(token.actor, ['prone']);
    }));
}
export const proneOnFail = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: fail,
            priority: 50
        }
    ]
};
