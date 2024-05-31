import {genericUtils, rollUtils} from '../../utils.js';
async function bonusDamage(workflow, formula, {ignoreCrit = false, damageType}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = rollUtils.getCriticalFormula(formula);
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.actor.getRollData()).evaluate();
    if (damageType) {
        genericUtils.setProperty(roll, 'options.type', damageType);
    } else {
        genericUtils.setProperty(roll, 'options.type', roll.terms[0].flavor);
    }
    workflow.damageRolls.push(roll);
    await workflow.setDamageRolls(workflow.damageRolls);
}
export let workflowUtils = {

};