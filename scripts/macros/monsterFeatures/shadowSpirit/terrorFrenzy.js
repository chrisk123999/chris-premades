import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function terrorFrenzy({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.advantage) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Frightened');
    if (!effect) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'terrorFrenzy', 150);
    if (!queueSetup) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add('Advantage: Terror Frenzy');
    queue.remove(workflow.item.uuid);
}