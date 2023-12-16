import {chris} from '../../helperFunctions.js';
export async function holdPerson({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    
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
            }
        }
    };
    for (let i of Array.from(workflow.targets)) if (chris.raceOrType(i.actor) != 'humanoid') await chris.createEffect(i.actor, effectData);
}