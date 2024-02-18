import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function explodingHeals(workflow) {
    if (!workflow.damageRoll) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'explodingHeals', 350);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!damageTypes.has('healing')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let newFormula = '';
    for (let i of workflow.damageRoll.terms) {
        if (i.isDeterministic) {
            newFormula += i.expression;
        } else {
            if (i.flavor === 'healing' && !i.expression.toLowerCase().includes('x')) {
                newFormula += i.expression + 'x[' + i.flavor + ']';
            } else {
                newFormula += i.formula;
            }
        }
    }
    let damageRoll = await new Roll(newFormula).roll({'async': true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}