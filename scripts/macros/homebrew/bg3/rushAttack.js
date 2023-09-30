import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = queue.setup(workflow.item.uuid, 'rushAttack', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    queue.remove(workflow.item.uuid);
}
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.rushAttack ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.rushAttack': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
export let rushAttack = {
    'item': item,
    'turn': turn
}