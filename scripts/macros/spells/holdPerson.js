import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function holdPerson({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'holdPerson', 50);
    if (!queueSetup) return;
    let effectData = {
        'name': 'Invalid Target',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'value': 99,
                'mode': 5,
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            },
            'chris-premades': {
                'effect': {
                    'noAnimation': true
                }
            }
        },
        'origin': workflow.item.uuid
    };
    for (let i of Array.from(workflow.targets)) if (chris.raceOrType(i.actor) != 'humanoid' && i.targeted.has(game.user)) await chris.createEffect(i.actor, effectData);
    queue.remove(workflow.item.uuid);
}