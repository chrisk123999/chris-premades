import {chris} from '../../../helperFunctions.js';
export async function wildhunt(workflow) {
    if (workflow.targets.size === 0 || workflow.disadvanage) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Wildhunt');
    if (!effect) return;
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 30) return;
    workflow.advantage = false;
    workflow.rollOptions.advantage = false;
    workflow.flankingAdvantage = false;
    workflow.attackAdvAttribution['Wildhunt'] = true;
}