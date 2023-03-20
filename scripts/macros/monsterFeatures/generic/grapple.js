import {chris} from '../../../helperFunctions.js';
export async function autoGrapple({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    await chris.addCondition(this.targets.first().actor, 'Grappled', false, this.item.uuid);
}