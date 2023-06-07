import {queue} from '../../queue.js';
export async function rayOfEnfeeblement({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.isFumble || workflow.item.type != 'weapon') return;
    if (workflow.item.system.properties?.fin) {
        let str = workflow.actor.system.abilities.str.value;
        let dex = workflow.actor.system.abilities.dex.value;
        if (str < dex) return;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'rayOfEnfeeblement', 360);
    if (!queueSetup) return;
    let damageRollFormula = 'floor((' + workflow.damageRoll._formula + ') / 2)';
    let damageRoll = await new Roll(damageRollFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}