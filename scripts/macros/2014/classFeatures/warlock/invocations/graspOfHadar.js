import {activityUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'eldritchBlast') return;
    if (!workflow.hitTargets.size) return;
    let validTargets = Array.from(workflow.hitTargets.filter(i => tokenUtils.getDistance(workflow.token, i) > genericUtils.convertDistance(5)));
    if (!validTargets.length) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    let target;
    if (validTargets.length > 1) {
        selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.GraspOfHadar.Select', validTargets);
        if (!selection?.length) return;
        target = selection[0];
    }
    if (!target) target = validTargets[0];
    let distance = tokenUtils.getDistance(workflow.token, target);
    let toMove = distance <= genericUtils.convertDistance(10) ? -genericUtils.convertDistance(5) : -genericUtils.convertDistance(10);
    await workflowUtils.completeItemUse(item);
    await tokenUtils.pushToken(workflow.token, target, toMove);
}
export let graspOfHadar = {
    name: 'Eldritch Invocations: Grasp of Hadar',
    version: '1.1.0',
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