import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function chillTouch({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let type = chris.raceOrType(workflow.actor);
    if (type.toLowerCase() != 'undead') return;
    let effect = chris.findEffect(workflow.actor, 'Chill Touch');
    if (!effect) return;
    let sourceActor = await fromUuid(effect.origin);
    let sourceActorId = sourceActor.actor.id;
    if (workflow.targets.first().actor.id != sourceActorId) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'chillTouch', 50);
    if (!queueSetup) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: Chill Touch');
    queue.remove(workflow.item.uuid);
}