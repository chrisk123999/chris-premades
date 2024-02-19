import {chris} from '../../../helperFunctions.js';
export async function psionicRevitalization({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let damageRoll = await new Roll('1d6[psychic]').roll({'async': true});
    let nearbyTargets = await chris.findNearby(workflow.targets.first(), 10, 'all');
    if (nearbyTargets.length === 0) return;
    await chris.applyWorkflowDamage(workflow.token, damageRoll, 'psychic', nearbyTargets, workflow.item.name, workflow.itemCardId);
}