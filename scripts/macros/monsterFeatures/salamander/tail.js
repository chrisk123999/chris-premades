import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function tail({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let effect = chris.findEffect(targetToken.actor, 'Tail');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (originItem.actor.id != this.actor.id) return;
    let queueSetup = await queue.setup(this.item.uuid, 'salamanderTail', 50);
    if (!queueSetup) return;
    let updatedRoll = await new Roll('100').evaluate({async: true});
	this.setAttackRoll(updatedRoll);
    queue.remove(this.item.uuid);
}