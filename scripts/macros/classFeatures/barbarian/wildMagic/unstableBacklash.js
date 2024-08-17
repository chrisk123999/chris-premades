import {effectUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let wildItem = itemUtils.getItemByIdentifier(workflow.actor, 'wildSurge');
    if (!wildItem) return;
    if (!effectUtils.getEffectByIdentifier(workflow.actor, 'rage')) return;
    await workflowUtils.completeItemUse(wildItem);
}
export let unstableBacklash = {
    name: 'Unstable Backlash',
    version: '0.12.20',
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