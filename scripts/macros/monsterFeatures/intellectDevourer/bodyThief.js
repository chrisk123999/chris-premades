import {chris} from '../../../helperFunctions.js';
export async function bodyThief({speaker, actor, token, character, item, args, scope, workflow}) {
	if (workflow.targets.size != 1) return;
	let targetActor = workflow.targets.first().actor;
	let actorCheck = await workflow.actor.rollAbilityTest('int');
	let targetCheck = await targetActor.rollAbilityTest('int');
	if (actorCheck.total <= targetCheck.total) return;
	let effectData = {
		'label': workflow.item.name,
		'icon': workflow.item.img,
		'duration': {
			'seconds': 604800
		}
	};
	await chris.createEffect(targetActor, effectData);
}