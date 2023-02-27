import {chris} from '../../../helperFunctions.js';
export async function autoGrapple(workflow) {
    if (workflow.hitTargets.size != 1) return;
    await chris.addCondition(workflow.targets.first().actor, 'Grappled', false, workflow.item.uuid);
}