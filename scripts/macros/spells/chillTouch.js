import {chris} from '../../helperFunctions.js';
export async function chillTouch({speaker, actor, token, character, item, args}) {
	if (this.targets.size != 1 || this.disadvantage) return;
	let type = chris.raceOrType(this.actor);
	if (type.toLowerCase() != 'undead') return;
	let effect = chris.findEffect(this.actor, 'Chill Touch');
	if (!effect) return;
	let sourceActor = await fromUuid(effect.origin);
	let sourceActorId = sourceActor.actor.id;
	if (this.targets.first().actor.id != sourceActorId) return;
	this.disadvantage = true;
	this.attackAdvAttribution['Disadvantage: Chill Touch'] = true;
}