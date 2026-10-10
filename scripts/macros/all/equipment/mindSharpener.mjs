import {actorUtils, dialogUtils, itemUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function succeed({actor, config, document: activity, roll}) {
    if (roll.isSuccess) return;
    if (!config.isConcentration) return;
    if (!activity.item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(actor)) return;
    if (!itemUtils.getEquipmentState(activity.item)) return;
    if (!await dialogUtils.confirmUseRollTotal(activity.item, roll.total)) return;
    await workflowUtils.syntheticActivityRoll(activity, []);
    return rollUtils.setTotalWithBonus(roll, roll.options.target ?? 99);
}
export const mindSharpener = {
    name: 'Mind Sharpener',
    version: '2.0.5',
    rules: 'all',
    save: [
        {
            pass: 'actorBonus',
            macro: succeed,
            priority: 200
        }
    ]
};
