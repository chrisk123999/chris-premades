async function getCriticalFormula(formula) {
    return new CONFIG.Dice.DamageRoll(formula, {}, {critical: true, powerfulCritical: game.settings.get('dnd5e', 'criticalDamageMaxDice'), multiplyNumeric: game.settings.get('dnd5e', 'criticalDamageModifiers')}).formula;
}
export let rollUtils = {
    getCriticalFormula
};