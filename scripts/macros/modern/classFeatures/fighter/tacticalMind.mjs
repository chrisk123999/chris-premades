import {actorUtils, automationUtils, D20Bonus, dialogUtils, workflowUtils} from '../../../../proxy.mjs';
async function bonus({document: item, options}) {
    const secondWind = actorUtils.getItemByIdentifier(item.parent, 'second-wind', {type: 'feat'});
    if (!secondWind?.system.uses.value) return;
    const formula = automationUtils.getConfigValue(item, 'bonus');
    return new D20Bonus(item, {formula, phase: 'postResult'})
        .withDefaultCosts()
        .withOnUse(() => workflowUtils.setWorkflowProperty(options, 'tacticalMind', true));
}
async function onSuccess({document: item, options, roll}) {
    if (!workflowUtils.getWorkflowProperty(options, 'tacticalMind')) return;
    let consumeResources = roll.isSuccess;
    if (!roll.isSuccess && !roll.isFailure)
        consumeResources ||= await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.TacticalMind', {total: roll.total}));
    await workflowUtils.syntheticItemRoll(item, [], {consumeResources});
}
const passes = [
    {
        pass: 'actorOptionalBonus',
        macro: bonus,
        priority: 300
    },
    {
        pass: 'actorPost',
        macro: onSuccess,
        priority: 300
    }
];
export const tacticalMind = {
    name: 'Tactical Mind',
    version: '2.0.4',
    rules: '2024',
    check: passes,
    skill: passes,
    tool: passes,
    config: {
        bonus: {
            default: '1d10',
            type: 'text',
            label: 'CHRISPREMADES.Config.Bonus',
            category: 'behavior'
        }
    }
};
