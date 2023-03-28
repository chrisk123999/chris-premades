import {chris} from '../../../helperFunctions.js';
export async function help({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    if (targetToken.id === this.token.id) return;
    let effectData;
    let targetDisposition = targetToken.document.disposition;
    let selfDisposition = this.token.document.disposition;
    if (targetDisposition === selfDisposition) {
        effectData = {
            'label': this.item.name,
            'icon': this.item.img,
            'origin': this.item.uuid,
            'duration': {
                'seconds': 3600
            },
            'changes': [
                {
                    'key': 'flags.midi-qol.advantage.ability.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'transfer': false,
                    'specialDuration': [
                        'isSkill'
                    ],
                    'stackable': 'multi',
                    'macroRepeat': 'none'
                }
            }
        }
    } else {
        effectData = {
            'label': this.item.name,
            'icon': this.item.img,
            'origin': this.item.uuid,
            'duration': {
                'seconds': 12
            },
            'changes': [
                {
                    'key': 'flags.midi-qol.grants.advantage.attack.all',
                    'mode': 0,
                    'value': '1',
                    'priority': 20
                }
            ],
            'flags': {
                'dae': {
                    'transfer': false,
                    'specialDuration': [
                        'isAttacked',
                        'turnStartSource'
                    ],
                    'stackable': 'multi',
                    'macroRepeat': 'none'
                }
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData);
}