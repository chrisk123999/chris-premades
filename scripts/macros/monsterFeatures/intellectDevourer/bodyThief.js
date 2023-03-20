import {chris} from '../../../helperFunctions.js';
export async function bodyThief({speaker, actor, token, character, item, args}) {
	if (this.targets.size != 1) return;
	let targetActor = this.targets.first().actor;
	let actorCheck = await this.actor.rollAbilityTest('int');
	let targetCheck = await targetActor.rollAbilityTest('int');
	if (actorCheck.total <= targetCheck.total) return;
	let effectData = {
		'label': this.item.name,
		'icon': this.item.img,
		'duration': {
			'seconds': 604800
		}
	};
	await chris.createEffect(targetActor, effectData);
}