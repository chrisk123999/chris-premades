import {dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (workflow.item.type !== 'spell' || workflow.item.system.level !== 0 || workflow.item.system.school !== 'nec' || workflow.item.flags['chris-premades']?.reap) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'reaper');
    if (!originItem) return;
    let targetToken = workflow.targets.first();
    let nearbyTargets = tokenUtils.findNearby(targetToken, 5, 'ally');
    if (!nearbyTargets.length) return;
    let selected = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}), nearbyTargets);
    if (!selected?.length) return;
    let newTarget = selected[0];
    await originItem.use();
    let newFeatureData = genericUtils.deepClone(workflow.item.toObject());
    genericUtils.setProperty(newFeatureData, 'flags.chris-premades.reap', true);
    await workflowUtils.syntheticItemDataRoll(newFeatureData, workflow.actor, [newTarget]);
}
export let reaper = {
    name: 'Reaper',
    version: '0.12.40',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};