import {dialogUtils, genericUtils, tokenUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let reverseCover = workflow.targets.has(workflow.token);
    let targets;
    if (!workflow.targets.size || (workflow.targets.size === 1 && workflow.targets.has(workflow.token))) {
        targets = workflow.token.parent.tokens.map(i => i.object).filter(j => tokenUtils.canSense(workflow.token, j) && j.document.uuid != workflow.token.document.uuid);
    } else {
        targets = Array.from(workflow.targets);
    }
    let text = reverseCover ? 'CHRISPREMADES.Macros.CheckCover.YourCover' : 'CHRISPREMADES.Macros.CheckCover.TargetCover';
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, text, targets, {type: 'multiple', maxAmount: targets.length, skipDeadAndUnconscious: false, coverToken: workflow.token, reverseCover: reverseCover, displayDistance: true});
    if (!selection) return;
    genericUtils.updateTargets(selection[0].filter(i => i));
}
export let checkCover = {
    name: 'Check Cover',
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