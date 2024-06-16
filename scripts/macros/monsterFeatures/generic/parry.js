import {chris} from '../../../helperFunctions.js';
export async function parry({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor) return;
    let bonus = chris.getConfiguration(workflow.item, 'acbonus') ?? false;
    if (!bonus) return;
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1,
        },
        'changes': [
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': '+ ' + bonus,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    '1Reaction'
                ]
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}