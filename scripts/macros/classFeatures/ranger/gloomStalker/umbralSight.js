import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function umbralSight({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || !workflow.token) return;
    let validTypes = ['dark', 'dim'];
    if (!validTypes.includes(chris.checkLight(workflow.token))) return;
    let targetToken = workflow.targets.first();
    let distance = chris.getDistance(workflow.token, targetToken);
    let targetSenses = targetToken.actor.system.attributes.senses;
    if ((!targetSenses.darkvision) || (targetSenses.tremorsense >= distance) || (targetSenses.blindsight >= distance) || (targetSenses.truesight >= distance)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'umbralSight', 150);
    if (!queueSetup) return;
    let feature = chris.getItem(workflow.actor, 'Umbral Sight');
    if (!feature) {
        queue.remove(workflow.item.uuid);
        return;
    }
    workflow.advantage= true;
    workflow.attackAdvAttribution.add('Advantage: ' + feature.name);
    queue.remove(workflow.item.uuid);
}