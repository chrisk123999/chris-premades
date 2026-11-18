import {effectUtils} from '../../../proxy.mjs';
async function rune({workflow}) {
    if (workflow.activity.identifier !== 'thunderbuss-rune') return;
    await Promise.all(workflow.failedSaves.documents.map(token => effectUtils.applyNoReactions(token.actor, {origin: workflow.item.uuid, specialDuration: ['turnStart']})));
}
export const thunderbuss = {
    name: 'Thunderbuss',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: rune,
            priority: 50
        }
    ]
};
