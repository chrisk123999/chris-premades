import {queue} from '../../../queue.js';
export async function swarmDamage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let hp = workflow.actor.system.attributes.hp.value;
    let maxhp = workflow.actor.system.attributes.hp.value;
    if (hp < Math.floor(maxhp / 2)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'swarmDamage', 50);
    if (!queueSetup) return;
    let damageFormula = workflow.damageRoll._formula;
    let diceNum = Number(damageFormula.substring(0,1)) / 2;
    let restOfFormula = damageFormula.substring(1);
    let newFormula = diceNum + restOfFormula;
    let damageRoll = await new Roll(newFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}