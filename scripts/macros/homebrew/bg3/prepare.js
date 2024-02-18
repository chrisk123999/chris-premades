import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function prepare({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let baseItem = workflow.item.system.type?.baseItem;
    if (baseItem != 'greataxe') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'prepare', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = workflow.actor.system.abilities.str.mod + '[' + workflow.defaultDamageType + ']';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    queue.remove(workflow.item.uuid);
}