import {dialogUtils, documentUtils, rollUtils} from '../../../../../proxy.mjs';
async function reroll({document: effect, roll}) {
    const choice = await dialogUtils.selectDie([roll], effect.name, _loc('CHRISPREMADES.Macros.Legacy.BlessingHearth', {formula: roll.formula}));
    if (!choice?.length) return;
    await rollUtils.rerollDice([roll], choice, 'highest');
    await documentUtils.deleteDocument(effect);
}
export const blessingOfTheHearth = {
    name: 'Blessing of the Hearth',
    version: '2.1.11',
    rules: '2014',
    hitDie: [
        {
            pass: 'actorBonus',
            macro: reroll,
            priority: 200
        }
    ]
};
