import {chris} from '../../../helperFunctions.js';
export async function autoGrapple({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    await chris.addCondition(workflow.targets.first().actor, 'Grappled', false, workflow.item.uuid);
}