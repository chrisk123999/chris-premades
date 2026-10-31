import {rollUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls?.length) return;
    const roll = workflow.damageRolls[0];
    const term = roll.dice.find(die => die.faces === 6);
    if (!term) return;
    const trimmed = workflow.isCritical && term.number > 2;
    if (trimmed) {
        term.results.splice(2);
        term.number = 2;
        roll.resetFormula();
        roll._total = roll._evaluateTotal();
    }
    const [first, second] = term.results.filter(result => result.active).map(result => result.result);
    if (first !== second) {
        if (trimmed) await workflow.setDamageRolls(workflow.damageRolls);
        return;
    }
    const extra = [];
    let result = second;
    let previous;
    do {
        previous = result;
        result = (await rollUtils.rollDice('1d6', {document: workflow.actor})).total;
        extra.push(result);
    } while (result === previous);
    await workflowUtils.bonusDamage(workflow, extra.join(' + '), {ignoreCrit: true, damageType: roll.options.type});
}
export const silverEagleMusket = {
    name: 'Silver Eagle Musket',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemDamageRoll',
            macro: damage,
            priority: 50
        }
    ]
};
