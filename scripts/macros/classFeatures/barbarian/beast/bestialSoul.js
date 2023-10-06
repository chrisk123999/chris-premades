import {chris} from '../../../../helperFunctions.js'
export async function bestialSoul({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog(workflow.item.name, [['Climbing', 'climb'], ['Jumping', 'jump'], ['Swimming', 'swim']], 'Which form?');
    if (!selection) return;
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        'flags': {
            'dae': {
                'specialDuration': [
                    'longRest',
                    'shortRest'
                ]
            }
        }
    };
    if (selection != 'jump') {
        effectData.changes = [
            {
                'key': 'system.attributes.movement.' + selection,
                'mode': 4,
                'value': '@attributes.movement.walk',
                'priority': 20
            }
        ]
    }
    await chris.createEffect(workflow.actor, effectData);
}