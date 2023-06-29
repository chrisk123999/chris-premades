import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function wildhunt(workflow) {
    if (workflow.targets.size === 0 || workflow.disadvanage) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Wildhunt');
    if (!effect) return;
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 30) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'wildhunt', 50);
    if (!queueSetup) return;
    workflow.advantage = false;
    workflow.rollOptions.advantage = false;
    workflow.flankingAdvantage = false;
    workflow.attackAdvAttribution.add('Wildhunt');
    queue.remove(workflow.item.uuid);
}