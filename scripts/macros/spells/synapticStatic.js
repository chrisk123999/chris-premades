import {chris} from '../../helperFunctions.js';
export async function synapticStatic({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    chris.updateTargets(Array.from(workflow.targets).filter(i => i.actor.system.abilities.int.value > 2).map(j => j.id));
}