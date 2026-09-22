import {automationUtils, D20Bonus} from '../../../../../proxy.mjs';
function bonus({document}) {
    if (!document.system.uses.value) return;
    const formula = automationUtils.getConfigValue(document, 'formula');
    return new D20Bonus(document, {action: 'special', formula, phase: 'postResult'}).withDefaultCosts().withDefaultOnUse();
}
export const favoredByTheGods = {
    name: 'Favored by the Gods',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorOptionalBonusAttack', phase: 'postResult', macro: bonus, priority: 300}
    ],
    save: [
        {pass: 'actorOptionalBonus', phase: 'postResult', macro: bonus, priority: 300}
    ],
    config: {
        formula: {
            default: '2d4',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior'
        }
    }
};
