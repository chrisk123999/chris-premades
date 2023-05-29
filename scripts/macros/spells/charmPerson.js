import {chris} from '../../helperFunctions.js';
export async function charmPerson({speaker, actor, token, character, item, args, scope, workflow}) {
	if (workflow.targets.size === 0) return;
	if (!chris.inCombat()) return;
	let effectData = {
		'label': 'Condition Advantage',
		'icon': 'icons/magic/time/arrows-circling-green.webp',
		'duration': {
			'turns': 1
		},
		'changes': [
			{
				'key': 'flags.midi-qol.advantage.ability.save.all',
				'value': '1',
				'mode': 5,
				'priority': 120
			}
		],
		'flags': {
			'dae': {
				'specialDuration': [
					'isSave'
				]
			}
		}
	};
	let targets = Array.from(workflow.targets);
	for (let i of targets) {
		await chris.createEffect(i.actor, effectData);
	}
}