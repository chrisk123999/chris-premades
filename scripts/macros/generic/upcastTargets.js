import {dialogUtils, genericUtils, workflowUtils} from '../../utils.js';
async function check(maxTargets, workflow) {
    if (maxTargets === 1 && workflow.item.system.target.affects.count === 2) maxTargets = 2; // Twinned spell stuff
    if (workflow.targets.size <= maxTargets) return;
    let oldTargets = Array.from(workflow.targets);
    let newTargets;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.UpcastTargets.Select', {maxTargets}), oldTargets, {type: 'multiple', maxAmount: maxTargets, skipDeadAndUnconscious: false});
    if (!selection) {
        newTargets = oldTargets.slice(0, maxTargets);
    } else {
        newTargets = selection[0] ?? [];
    }
    await workflowUtils.updateTargets(workflow, newTargets);
}
async function plusOne({workflow}) {
    let castLevel = workflowUtils.getCastLevel(workflow);
    let maxTargets = castLevel - workflow.item.system.level + 1;
    await check(maxTargets, workflow);
}
async function plusTwo({workflow}) {
    let castLevel = workflowUtils.getCastLevel(workflow);
    let maxTargets = castLevel - workflow.item.system.level + 2;
    await check(maxTargets, workflow);
}
async function plusThree({workflow}) {
    let castLevel = workflowUtils.getCastLevel(workflow);
    let maxTargets = castLevel - workflow.item.system.level + 3;
    await check(maxTargets, workflow);
}
async function plusFour({workflow}) {
    let castLevel = workflowUtils.getCastLevel(workflow);
    let maxTargets = castLevel - workflow.item.system.level + 4;
    await check(maxTargets, workflow);
}
export let upcastTargets = {
    check,
    plusOne,
    plusTwo,
    plusThree,
    plusFour
};