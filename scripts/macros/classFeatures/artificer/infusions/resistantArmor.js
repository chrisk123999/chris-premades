import {chris} from '../../../../helperFunctions.js';
export async function resistantArmor(origin, effect) {
    let resistance = chris.getConfiguration(origin, 'resistance');
    if (!resistance) return;
    if (effect.changes[0].value === resistance) return;
    let updates = {
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'priority': 20,
                'value': resistance
            }
        ]
    }
    await chris.updateEffect(effect, updates);
}