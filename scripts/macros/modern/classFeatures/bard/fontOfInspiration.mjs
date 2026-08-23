import {actorUtils, dialogUtils, genericUtils, workflowUtils} from '../../../../proxy.mjs';
async function spendSpellSlot({document: activity, config}) {
    if (config.fontOfInspiration) return;
    if (!actorUtils.hasSpellSlots(activity.actor)) {
        genericUtils.notify('CHRISPREMADES.Macros.Modern.FontOfInspiration.NoSlots', {type: 'warn'});
        return true;
    }
    const selection = await dialogUtils.selectSpellSlots(activity.actor, activity.item.name, 'CHRISPREMADES.Macros.Modern.FontOfInspiration.Prompt', {maxAmount: 1, maxAmountMode: 'count'});
    const target = activity.actor.system.spells[selection?.[0]?.key]?.level;
    if (!target) return true;
    const data = activity.toObject();
    data.consumption.targets = [
        {
            target: 'bardic-inspiration',
            type: 'itemUses',
            value: '-1'
        },
        {
            target,
            type: 'spellSlots',
            value: '1'
        }
    ];
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, [], {config: {fontOfInspiration: true}});
    return true;
}
export const fontOfInspiration = {
    name: 'Font of Inspiration',
    version: '2.0.2',
    rules: '2024',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: spendSpellSlot,
            priority: 50
        }
    ]
};
