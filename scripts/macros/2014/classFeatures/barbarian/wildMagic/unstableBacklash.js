import {effectUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let wildItem = itemUtils.getItemByIdentifier(workflow.actor, 'wildSurge');
    if (!wildItem) return;
    if (!effectUtils.getEffectByIdentifier(workflow.actor, 'rage')) return;
    await workflowUtils.completeItemUse(wildItem);
}
export let unstableBacklash = {
    name: 'Unstable Backlash',
    version: '1.1.0',
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