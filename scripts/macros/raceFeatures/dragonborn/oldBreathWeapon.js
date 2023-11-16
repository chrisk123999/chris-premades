import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function oldBreathWeapon({speaker, actor, token, character, item, args, scope, workflow}) {
    let level = Math.max(chris.levelOrCR(workflow.actor), 1);
    if (level < 6) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'oldBreathWeapon', 50);
    if (!queueSetup) return;
    let dice = level >= 16 ? 5 : level >= 11 ? 4 : 3;
    let parts = duplicate(workflow.item.system.damage.parts);
    parts[0][0] = dice + 'd6[' + parts[0][1] + ']';
    workflow.item = workflow.item.clone({'system.damage.parts': parts}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    queue.remove(workflow.item.uuid);
}