import {chris} from '../../../helperFunctions.js';
export async function berserk(actor, origin) {
    if (actor.system.attributes.hp.value > 60) return;
    let effect = chris.findEffect(actor, 'Beserk');
    if (effect) return;
    let workflow = await MidiQOL.completeItemUse(origin);
    if (workflow.damageTotal != 6) return;
    let effectData = {
        'label': 'Beserk',
        'icon': origin.img,
        'duration': {
            'seconds': 86400
        },
        'flags': {
            'dae': {
                'specialDuration': [
                    'longRest'
                ]
            }
        }
    };
    await chris.createEffect(actor, effectData);
}