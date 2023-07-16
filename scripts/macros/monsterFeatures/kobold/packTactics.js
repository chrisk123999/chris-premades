import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function pactTactics({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let nearbyTargets = chris.findNearby(workflow.targets.first(), 5, 'enemy', false).filter(i => i.document.uuid != workflow.token.document.uuid);
    if (nearbyTargets.length === 0) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'pactTactics', 150);
    if (!queueSetup) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add('Advantage: Pack Tactics');
    queue.remove(workflow.item.uuid);
}