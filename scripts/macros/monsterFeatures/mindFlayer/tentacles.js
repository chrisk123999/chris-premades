import {chris} from '../../../helperFunctions.js';
export async function tentacles({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let target = workflow.targets.first().actor;
    if (chris.getSize(target) > 2) return;
    if (chris.checkTrait(target, 'ci', 'grappled')) return;
    await chris.addCondition(target, 'Grappled', false, workflow.item.uuid);
}