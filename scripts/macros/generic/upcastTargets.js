import {dialogUtils, genericUtils} from '../../utils.js';
async function check(maxTargets, workflow) {
    if (workflow.targets.size <= maxTargets) return;
    let oldTargets = Array.from(workflow.targets);
    let newTargets;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.UpcastTargets.Select', {maxTargets}), oldTargets, {type: 'multiple', maxAmount: maxTargets});
    if (!selection) {
        newTargets = oldTargets.slice(0, maxTargets);
    } else {
        newTargets = selection[0] ?? [];
    }
    genericUtils.updateTargets(newTargets);
}
async function plusOne({workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 1;
    await check(maxTargets, workflow);
}
async function plusTwo({workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 2;
    await check(maxTargets, workflow);
}
async function plusThree({workflow}) {
    let castLevel = workflow.castData.castLevel;
    let maxTargets = castLevel - workflow.item.system.level + 3;
    await check(maxTargets, workflow);
}
async function plusFour({workflow}) {
    let castLevel = workflow.castData.castLevel;
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