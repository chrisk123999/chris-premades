import {chris} from '../../../../helperFunctions.js';
export async function feyPresence({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size === 0) return;
    let selection = await chris.dialog('What condition?', [['Charmed', 'Charmed'], ['Frightened', 'Frightened']]);
    if (!selection) selection = 'Charmed';
    let effectData = {
        'label': this.item.name,
        'icon': this.item.img,
        'origin': this.item.uuid,
        'duration': {
            'seconds': 12
        },
        'changes': [
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': selection,
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnEndSource'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    for (let token of this.failedSaves) {
        await chris.createEffect(token.actor, effectData);
    }
}