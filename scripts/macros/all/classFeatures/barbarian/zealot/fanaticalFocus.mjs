import {dialogUtils, documentUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function rageBegin({document: activity}) {
    if (activity.item.system.uses.spent) await documentUtils.update(activity.item, {'system.uses.spent': 0});
}
async function reroll({document: activity, config, dialog, macroClass: {identifier, source}, message, roll}) {
    if (roll.isSuccess) return;
    if (!activity.item.system.uses.value) return Logging.addMacroWarning(source, identifier, 'Fanatical Focus exited early without item uses.');
    if (!activity.actor.flags[source]?.raging) return Logging.addMacroWarning(source, identifier, 'Fanatical Focus exited early, not raging.');
    if (workflowUtils.getWorkflowProperty(config, identifier)) return Logging.addMacroWarning(source, identifier, 'Fanatical Focus exited early, already used for this roll.');
    if (!await dialogUtils.confirmUseRollTotal(activity.item, roll.total)) return;
    workflowUtils.setWorkflowProperty(config, identifier, true);
    const rerollConfig = {...config};
    if (activity.roll.formula) {
        rerollConfig.rolls ??= [];
        rerollConfig.rolls.push({parts: [activity.roll.formula]});
    }
    const newRoll = (await activity.actor.rollSavingThrow(rerollConfig, {...dialog, configure: false}, {...message, create: false}))?.[0];
    if (!newRoll) return roll;
    await workflowUtils.syntheticActivityRoll(activity);
    return rollUtils.replaceRollShowDiscarded(roll, newRoll);
}
export const fanaticalFocus = {
    name: 'Fanatical Focus',
    version: '2.1.4',
    rules: 'all',
    called: [
        {
            pass: 'actorRageBegin',
            macro: rageBegin,
            priority: 210
        }
    ],
    save: [
        {
            pass: 'actorBonus',
            macro: reroll,
            priority: 300
        }
    ]
};
