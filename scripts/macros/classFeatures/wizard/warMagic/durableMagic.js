import {chris} from '../../../../helperFunctions.js';
export async function durableMagic({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!(workflow.item.system.components?.concentration || workflow.item.flags.midiProperties?.concentration)) return;
    let effect = chris.findEffect(workflow.actor, 'Concentrating');
    if (!effect) return;
    if (effect.flags['chris-premades']?.feature?.durableMagic) return;
    let updates = {
        'changes': [
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': '+2',
                'priority': 20
            },
            {
                'key': 'system.bonuses.abilities.save',
                'mode': 2,
                'value': '+2',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'feature': {
                    'durableMagic': true
                }
            }
        }
    };
    await chris.updateEffect(effect, updates);
}