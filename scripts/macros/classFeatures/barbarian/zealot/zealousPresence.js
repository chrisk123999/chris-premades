import {dialogUtils, genericUtils} from '../../../../utils.js';

async function early({workflow}) {
    let maxTargets = 10;
    if (workflow.targets.size <= maxTargets) return;
    let oldTargets = Array.from(workflow.targets);
    let newTargets;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.ZealousPresence.Select', {maxTargets}), oldTargets, {type: 'multiple', skipDeadAndUnconscious: true, maxAmount: maxTargets});
    if (!selection) {
        newTargets = oldTargets.slice(0, maxTargets);
    } else {
        newTargets = selection[0] ?? [];
    }
    genericUtils.updateTargets(newTargets);
}
export let zealousPresence = {
    name: 'Zealous Presence',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 20
            }
        ]
    }
};