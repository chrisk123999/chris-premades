import {automationUtils, D20Bonus} from '../../../../proxy.mjs';
function validate({roll}) {
    return roll?.isFumble ? 'CHRISPREMADES.Macros.Generic.Common.Fumble' : true;
}
async function bonus({document}) {
    if (!document.system.uses.value) return;
    const formula = automationUtils.getConfigValue(document, 'formula');
    return new D20Bonus(document, {action: 'special', formula}).withValidation(validate).withDefaultCosts().withDefaultOnUse();
}
export const restorativeRest = {
    name: 'Restorative Rest',
    version: '2.0.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorOptionalBonusAttack',
            macro: bonus,
            priority: 300
        }
    ],
    check: [
        {
            pass: 'actorOptionalBonus',
            macro: bonus,
            priority: 300
        }
    ],
    save: [
        {
            pass: 'actorOptionalBonus',
            macro: bonus,
            priority: 300
        }
    ],
    skill: [
        {
            pass: 'actorOptionalBonus',
            macro: bonus,
            priority: 300
        }

    ],
    tool: [
        {
            pass: 'actorOptionalBonus',
            macro: bonus,
            priority: 300
        }
    ],
    config: {
        formula: {
            default: '1d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior',
            hint: ''
        }
    }
};
