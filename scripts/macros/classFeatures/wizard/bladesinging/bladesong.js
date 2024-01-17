import {chris} from '../../../../helperFunctions.js';
export async function bladesong({speaker, actor, token, character, item, args, scope, workflow}) {
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': '+' + workflow.actor.system.abilities.int.mod,
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'feature': {
                    'bladesong': true
                }
            },
            'dae': {
                'specialDuration': [
                    'zeroHP'
                ]
            }
        }
    };
    let songOfVictory = chris.getItem(workflow.actor, 'Song of Victory');
    if (songOfVictory) {
        effectData.changes.push(
            {
                'key': 'system.bonuses.mwak.damage',
                'mode': 2,
                'value': '+' + workflow.actor.system.abilities.int.mod,
                'priority': 20
            }
        );
    }
    await chris.createEffect(workflow.actor, effectData);
}