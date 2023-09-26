import {chris} from '../../../helperFunctions.js';
export async function flourish(effect) {
    if (effect.flags['chris-premades']?.feature?.flourish) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.flourish': true
    };
    await chris.updateEffect(effect, updates);
}