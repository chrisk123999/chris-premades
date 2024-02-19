import {chris} from '../../../helperFunctions.js';
export async function longLimbed(origin, actor) {
    console.log(origin);
    let effectData = {
        'icon': origin.img,
        'origin': origin.uuid,
        'duration': {
            'turns': 1
        },
        'name': origin.name,
        'changes': [
            {
                'key': 'flags.midi-qol.range.mwak',
                'mode': 2,
                'value': '+5',
                'priority': 20
            }
        ]
    };
    await chris.createEffect(actor, effectData);
    if (chris.getConfiguration(origin, 'displaycard') ?? true) await origin.displayCard();
}