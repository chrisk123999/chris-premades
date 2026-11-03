import {dialogUtils, queryUtils} from '../../../proxy.mjs';
async function choose({document: item, workflow}) {
    const roll = workflow.utilityRolls?.[0];
    const die = roll?.dice[0];
    if (!die) return;
    const faces = Array.from({length: die.faces}, (_, index) => [String(index + 1), index + 1]);
    const selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.All.CharlatansDie.Use', faces, {displayAsRows: true, userId: queryUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    die.results.forEach(result => result.result = Number(selection));
    roll._total = roll._evaluateTotal();
    await workflow.setUtilityRolls([roll]);
}
export const charlatansDie = {
    name: 'Charlatan\'s Die',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemUtilityRollComplete',
            macro: choose,
            priority: 50
        }
    ]
};
