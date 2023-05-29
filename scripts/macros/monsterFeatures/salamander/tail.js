import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function tail({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let effect = chris.findEffect(targetToken.actor, 'Tail');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (originItem.actor.id != workflow.actor.id) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'salamanderTail', 50);
    if (!queueSetup) return;
    let updatedRoll = await new Roll('100').evaluate({async: true});
	workflow.setAttackRoll(updatedRoll);
    queue.remove(workflow.item.uuid);
}