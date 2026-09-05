import {automationUtils, D20Bonus} from '../../../../proxy.mjs';
async function bonus({document, roll, workflow}) {
    if (!document.system.uses.value) return;
    if (!roll) roll = workflow.attackRoll;
    if (roll.isFumble) return;
    const formula = automationUtils.getConfigValue(document, 'formula');
    return new D20Bonus(document, {action: 'special', formula}).withDefaultCosts().withDefaultOnUse();
}
export const restorativeRest = {
    name: 'Restorative Rest',
    version: '2.0.3',
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