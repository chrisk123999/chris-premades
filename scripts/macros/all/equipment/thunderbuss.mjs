import {actorUtils} from '../../../proxy.mjs';
async function rune({workflow}) {
    if (workflow.activity.identifier !== 'thunderbuss-rune') return;
    await Promise.all(Array.from(workflow.failedSaves, token => actorUtils.setReactionUsed(token.actor)));
}
export const thunderbuss = {
    name: 'Thunderbuss',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: rune,
            priority: 50
        }
    ]
};
