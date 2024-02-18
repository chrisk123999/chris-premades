import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function potionOfMaximumPower({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    if (workflow.item.type != 'spell') return;
    if (workflow.castData.castLevel > 4) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'potionOfMaximumPower', 480);
    if (!queueSetup) return;
    await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
        arr[i] = await damageRoll.reroll({'maximize': true});
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    let effect = chris.findEffect(workflow.actor, 'Potion of Maximum Power');
    if (effect) await chris.removeEffect(effect);
    queue.remove(workflow.item.uuid);
}