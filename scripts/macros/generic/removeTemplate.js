import {chris} from '../../helperFunctions.js';
export async function removeTemplate({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, this.item.name + ' Template');
    if (!effect) return;
    let updates = {
        'duration': {
            'seconds': 1
        }
    };
    await chris.updateEffect(effect, updates);
}