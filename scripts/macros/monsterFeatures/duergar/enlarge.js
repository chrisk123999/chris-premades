import {queue} from '../../../utility/queue.js';
export async function enlarge({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.type != 'weapon') return;
    if (workflow.item.system.properties?.fin) {
        let str = workflow.actor.system.abilities.str.value;
        let dex = workflow.actor.system.abilities.dex.value;
        if (str < dex) return;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'enlarge', 50);
    if (!queueSetup) return;
    let diceNum = workflow.damageRoll.terms[0].number * 2;
    let damageFormula = diceNum + workflow.damageRoll._formula.substring(1);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}