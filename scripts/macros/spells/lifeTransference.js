import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function lifeTransference({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let damageFormula = (workflow.castData.castLevel + 1) + 'd8[none]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    await chris.applyDamage(workflow.token, damageRoll.total, 'none');
    let queueSetup = await queue.setup(workflow.item.uuid, 'lifeTransference', 50);
    if (!queueSetup) return;
    let healing = damageRoll.total * 2;
    let healingRoll = await new Roll(healing + '[healing]').roll({'async': true});
    await workflow.setDamageRoll(healingRoll);
    queue.remove(workflow.item.uuid);
}