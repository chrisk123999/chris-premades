import {actorUtils, automationUtils, D20Bonus, rollUtils} from '../../../../proxy.mjs';
async function missed({document: activity}) {
    const identifier = automationUtils.getConfigValue(activity.item, 'pointsItem');
    const points = actorUtils.getItemByIdentifier(activity.actor, identifier, {type: 'feat'});
    if (!points?.system.uses.value) return;
    let maxScaling = 3;
    if (activity.consumption.scaling.max)
        maxScaling = rollUtils.rollDiceSync(activity.consumption.scaling.max, {document: activity})?.total;
    maxScaling = Math.min(points.system.uses.value, maxScaling);
    return new D20Bonus(activity, {formula: '2', maxScaling, phase: 'postResult'})
        .withScalingHandler(({bonus}) => new bonus.rollClass(String(2 + 2 * bonus.scalingIncrease), bonus.roll.data, bonus.roll.options))
        .withDefaultCosts()
        .withDefaultOnUse();
}
export const focusedAim = {
    name: 'Focused Aim',
    version: '2.0.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusAttack',
            macro: missed,
            priority: 200
        }
    ],
    config: {
        pointsItem: {
            default: 'ki',
            type: 'text',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Legacy.FocusedAim'
        }
    }
};
