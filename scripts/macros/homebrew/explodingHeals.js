import {rollUtils} from '../../utils.js';
export async function explodingHeals(workflow) {
    if (!workflow.damageRolls) return;
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        if (roll.options.type != 'healing') return roll;
        let newFormula = '';
        for (let i of roll.terms) {
            if (i.isDeterministic) {
                newFormula += i.expression;
            } else if (i.expression.toLowerCase().includes('x')) {
                newFormula += i.formula;
            } else if (i.flavor) {
                newFormula += i.expression + 'x[' + i.flavor + ']';
            } else {
                newFormula += i.expression + 'x';
            }
        }
        return await rollUtils.damageRoll(newFormula, workflow.actor, roll.options);
    }));
    await workflow.setDamageRolls(damageRolls);
}