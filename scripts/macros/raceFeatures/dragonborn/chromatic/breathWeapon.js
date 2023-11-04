import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function breathWeapon({speaker, actor, token, character, item, args, scope, workflow}) {
    let level = Math.max(chris.levelOrCR(workflow.actor), 1);
    if (level < 5) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'breathWeapon', 50);
    if (!queueSetup) return;
    let dice = level >= 17 ? 4 : level >= 11 ? 3 : 2;
    let parts = duplicate(workflow.item.system.damage.parts);
    parts[0][0] = dice + 'd10[' + parts[0][1] + ']';
    workflow.item = workflow.item.clone({'system.damage.parts': parts}, {'keepId': true});
    queue.remove(workflow.item.uuid);
}