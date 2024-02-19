import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function rayOfEnfeeblement({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.isFumble || workflow.item.type != 'weapon') return;
    if (workflow.item.system.properties.has('fin')) {
        let str = workflow.actor.system.abilities.str.value;
        let dex = workflow.actor.system.abilities.dex.value;
        if (str < dex) return;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'rayOfEnfeeblement', 360);
    if (!queueSetup) return;
    workflow.damageRolls = await Promise.all(workflow.damageRolls.map(async damageRoll => {
        return await chris.damageRoll(workflow, 'floor((' + damageRoll._formula + ') / 2)', {'type': damageRoll.options.type}, true);
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    queue.remove(workflow.item.uuid);
}