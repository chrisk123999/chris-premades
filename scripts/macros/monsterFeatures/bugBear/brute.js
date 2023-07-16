import {queue} from '../../../utility/queue.js';
export async function brute({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.damageRoll) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'brute', 101);
    if (!queueSetup) return;
    let damageFormula = workflow.damageRoll._formula;
    let diceNum = Number(damageFormula.substring(0,1)) + 1;
    let restOfFormula = damageFormula.substring(1);
    let newFormula = diceNum + restOfFormula;
    let damageRoll = await new Roll(newFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}