import {chris} from '../../../../helperFunctions.js';
export async function durableMagic({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!(workflow.item.system.properties.has('concentration') || workflow.item.flags.midiProperties?.concentration)) return;
    let effect = MidiQOL.getConcentrationEffect(workflow.actor, workflow.item);
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