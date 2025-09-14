import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function veryEarly({activity, dialog, actor, config}) {
    if (activity.item.system.uses.value) return;
    dialog.configure = false;
    let rage = itemUtils.getItemByIdentifier(actor, 'rage');
    if (!rage?.system?.uses?.value) return true;
    let selection = await dialogUtils.confirm(activity.item.name, 'CHRISPREMADES.Macros.ZealousPresence.Rage');
    if (!selection) return true;
    genericUtils.setProperty(config, 'consume.resources', false);
    await genericUtils.update(rage, {'system.uses.spent': rage.system.uses.spent + 1});
}
async function early({trigger, workflow}) {
    if (workflow.targets.size <= 10) return;
    let oldTargets = Array.from(workflow.targets);
    let newTargets;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.UpcastTargets.Select', {maxTargets: 10}), oldTargets, {type: 'multiple', maxAmount: 10, skipDeadAndUnconscious: false});
    if (!selection) {
        newTargets = oldTargets.slice(0, 10);
    } else {
        newTargets = selection[0] ?? [];
    }
    await workflowUtils.updateTargets(workflow, newTargets);
}
export let zealousPresence = {
    name: 'Zealous Presence',
    version: '1.1.28',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};