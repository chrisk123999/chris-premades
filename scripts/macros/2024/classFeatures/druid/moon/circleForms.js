import {itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let wildShape = itemUtils.getItemByIdentifier(workflow.actor, 'wildShape');
    if (!wildShape) return;
    if (!itemUtils.canUse(wildShape)) return;
    await workflowUtils.specialItemUse(wildShape, [workflow.token], workflow.item, {consumeResources: true, consumeUsage: true});
}
export let circleForms = {
    name: 'Circle Forms',
    version: '1.3.124',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};