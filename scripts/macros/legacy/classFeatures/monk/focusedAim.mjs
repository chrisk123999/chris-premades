import {actorUtils, automationUtils, D20Bonus} from '../../../../proxy.mjs';
async function missed({document: activity}) {
    const identifier = automationUtils.getConfigValue(activity.item, 'pointsItem');
    const points = actorUtils.getItemByIdentifier(activity.actor, identifier, {type: 'feat'});
    if (!points?.system.uses.value) return;
    const maxScaling = Math.min(points.system.uses.value, 3);
    return new D20Bonus(activity, {formula: '2', maxScaling, phase: 'postResult'})
        .withScalingHandler(({bonus}) => new bonus.rollClass(String(2 + 2 * bonus.scalingValue), bonus.roll.data, bonus.roll.options))
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
            label: ''
        }
    }
};
