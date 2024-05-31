import {genericUtils} from './genericUtils.js';
async function bonusDamage(workflow, formula, {ignoreCrit = false, damageType}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = getCriticalFormula(formula);
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.actor.getRollData()).evaluate();
    if (damageType) {
        genericUtils.setProperty(roll, 'options.type', damageType);
    } else {
        genericUtils.setProperty(roll, 'options.type', roll.terms[0].flavor);
    }
    workflow.damageRolls.push(roll);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function getCriticalFormula(formula) {
    return new CONFIG.Dice.DamageRoll(formula, {}, {critical: true, powerfulCritical: game.settings.get('dnd5e', 'criticalDamageMaxDice'), multiplyNumeric: game.settings.get('dnd5e', 'criticalDamageModifiers')}).formula;
}
export let rollUtils = {
    bonusDamage,
    getCriticalFormula
};