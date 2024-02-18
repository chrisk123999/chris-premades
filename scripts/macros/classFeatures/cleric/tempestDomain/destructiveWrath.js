import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function destructiveWrath({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'destructiveWrath', 351);
    if (!queueSetup) return;
    if (workflow.damageRolls.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let validTypes = ['lightning', 'thunder'];
    await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
        if (validTypes.includes(damageRoll.options.type)) arr[i] = await damageRoll.reroll({'maximize': true});
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    queue.remove(workflow.item.uuid);
}