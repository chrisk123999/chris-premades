import {chris} from '../../../helperFunctions.js';
export async function help({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    if (targetToken.id === workflow.token.id) return;
    let effectData;
    let targetDisposition = targetToken.document.disposition;
    let selfDisposition = workflow.token.document.disposition;
    if (targetDisposition === selfDisposition) {
        effectData = {
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
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
            'label': workflow.item.name,
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
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