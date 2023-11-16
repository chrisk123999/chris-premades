import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function effect(effect) {
    if (effect.flags['chris-premades']?.feature?.flourish) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.flourish': true
    };
    await chris.updateEffect(effect, updates);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'flourish', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) {
        workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
        workflow.item.prepareData();
        workflow.item.prepareFinalAttributes();
    }
    queue.remove(workflow.item.uuid);
}
export let flourish = {
    'effect': effect,
    'item': item
}