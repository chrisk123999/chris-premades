import {chris} from '../../helperFunctions.js';
export async function shockingGrasp({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    await chris.addCondition(targetActor, 'Reaction', false, this.item.uuid);
}