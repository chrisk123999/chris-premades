import {chris} from '../../../helperFunctions.js';
export async function psionicRevitalization({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let damageRoll = await new Roll('1d6[psychic]').roll({async: true});
    let nearbyTargets = await chris.findNearby(this.targets.first(), 10, 'all');
    if (nearbyTargets.length === 0) return;
    await chris.applyWorkflowDamage(this.token, damageRoll, 'psychic', nearbyTargets, this.item.name, this.itemCardId);
}