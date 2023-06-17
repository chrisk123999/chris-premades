import {chris} from '../../../helperFunctions.js';
export async function blessingOfTheRavenQueen({speaker, actor, token, character, item, args, scope, workflow}) {
    let level = workflow.actor.system?.details?.level;
    if (level < 3) return;
    let effect = chris.findEffect(workflow.actor, 'Blessing of the Raven Queen Resistance');
    if (effect) await chris.removeEffect(effect);
    let effectData = {
        'label': 'Blessing of the Raven Queen Resistance',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'rounds': 1
        },
        'changes': [
            {
                'key': 'system.traits.dr.all',
                'mode': 0,
                'value': 1,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource'
                ],
                'stackable': 'none',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
}