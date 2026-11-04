import {documentUtils} from '../../../proxy.mjs';
async function unlock({document: item, workflow}) {
    const roll = workflow.utilityRolls?.[0];
    if (!roll || roll.total <= 95) return;
    if (item.system.quantity > 1) await documentUtils.update(item, {'system.quantity': item.system.quantity - 1});
    else await documentUtils.deleteDocument(item);
}
export const mysteryKey = {
    name: 'Mystery Key',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: unlock,
            priority: 50
        }
    ]
};
