import {actorUtils, automationUtils, constants, dialogUtils, genericUtils, queryUtils, rollUtils, workflowUtils} from '../../../../proxy.mjs';
async function reroll({config, document: item, roll, token}) {
    if (config['chris-premades']?.countercharm) return;
    if (!roll.options.target || roll.isSuccess) return;
    if (actorUtils.hasUsedReaction(item.parent)) return;
    const conditions = config.cat?.conditions;
    if (!conditions || !conditions.size) return;
    const validConditions = automationUtils.getConfigValue(item, 'conditions');
    if (!validConditions.some(c => conditions.has(c))) return;
    if (!await dialogUtils.confirmUseForRollTotal(item, token.actor.name, roll.total, {userId: queryUtils.firstOwner(item.parent, true)})) return;
    await workflowUtils.completeItemUse(item, [token]);
    genericUtils.setProperty(config, 'chris-premades.countercharm', true);
    genericUtils.setProperty(config, 'midiOptions.advantage', true);
    const newRoll = (await token.actor.rollSavingThrow(config, undefined, {create: false}))?.[0];
    if (!newRoll) return;
    return rollUtils.replaceRollShowDiscarded(roll, newRoll);
}
export const countercharm = {
    name: 'Countercharm',
    version: '2.0.2',
    rules: '2024',
    save: [
        {
            pass: 'nearbyBonus',
            macro: reroll,
            priority: 400,
            configDistance: 'distance'
        }
    ],
    config: {
        conditions: {
            default: ['charmed', 'frightened'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Conditions',
            get options() { return constants.statusOptions(); }
        },
        distance: {
            default: 30,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance'
        }
    }
};
