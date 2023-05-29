import {chris} from '../../helperFunctions.js';
export async function removeTemplate({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, workflow.item.name + ' Template');
    if (!effect) return;
    let updates = {
        'duration': {
            'seconds': 1
        }
    };
    await chris.updateEffect(effect, updates);
}