import {chris} from '../../helperFunctions.js';
export async function chillTouch({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    let type = chris.raceOrType(workflow.actor);
    if (type.toLowerCase() != 'undead') return;
    let effect = chris.findEffect(workflow.actor, 'Chill Touch');
    if (!effect) return;
    let sourceActor = await fromUuid(effect.origin);
    let sourceActorId = sourceActor.actor.id;
    if (workflow.targets.first().actor.id != sourceActorId) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution['Disadvantage: Chill Touch'] = true;
}