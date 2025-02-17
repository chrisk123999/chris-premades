import {dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size !== 1) return;
    if (workflow.item.type !== 'spell' || workflow.item.system.level !== 0 || workflow.item.system.school !== 'nec' || workflow.item.flags['chris-premades']?.reap) return;
    let targetToken = workflow.targets.first();
    let nearbyTargets = tokenUtils.findNearby(targetToken, 5, 'ally');
    if (!nearbyTargets.length) return;
    let selected = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), nearbyTargets);
    if (!selected?.length) return;
    let newTarget = selected[0];
    await workflowUtils.completeItemUse(item);
    let newFeatureData = genericUtils.duplicate(workflow.item.toObject());
    genericUtils.setProperty(newFeatureData, 'flags.chris-premades.reap', true);
    await workflowUtils.syntheticItemDataRoll(newFeatureData, workflow.actor, [newTarget]);
}
export let reaper = {
    name: 'Reaper',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    ddbi: {
        renamedItems: {
            'Reaper: Chill Touch': 'Reaper',
            'Reaper: Sapping Sting': 'Reaper',
            'Reaper: Spare the Dying': 'Reaper',
            'Reaper: Toll the Dead': 'Reaper'
        }
    }
};