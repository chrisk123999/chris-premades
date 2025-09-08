import {itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let mageHand = itemUtils.getItemByIdentifier(workflow.actor, 'mageHand');
    if (!mageHand) return;
    await workflowUtils.specialItemUse(mageHand, [], workflow.item);
}
export let mageHandLegerdemain = {
    name: 'Mage Hand Legerdemain',
    version: '1.3.47',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    }
};