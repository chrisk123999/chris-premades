import {chris} from '../../helperFunctions.js';
export async function shockingGrasp(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    await chris.addCondition(targetActor, 'Reaction', false, workflow.item.uuid);
}