import {workflowUtils} from '../../../../../proxy.mjs';
async function turnStart({document: item, round}) {
    if (round !== 1) return;
    await workflowUtils.completeItemUse(item);
}
export const dreadAmbusher = {
    name: 'Dread Ambusher',
    version: '2.1.8',
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};
