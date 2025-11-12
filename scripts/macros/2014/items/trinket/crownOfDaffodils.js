import {activityUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let uses = workflow.actor.items.get(workflow.item.id)?.system?.uses?.value;
    if (uses) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'crownOfDaffodilsSelfEffect');
    if (effect) await genericUtils.update(effect, {disabled: true});
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'wither', {strict: true});
    if (!activity) return;
    let witherWorkflow = await workflowUtils.syntheticActivityRoll(activity, [workflow.token]);
    if (witherWorkflow.utilityRolls[0].total != 0) return;
    let sourceEffect = itemUtils.getEffectByIdentifier(workflow.item, 'crownOfDaffodilsWithered');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid,
    await itemUtils.enchantItem(workflow.item, effectData);
}
async function rest({trigger: {entity: item}}) {
    if (!itemUtils.getEquipmentState(item)) return;
    let effect = effectUtils.getEffectByIdentifier(item.actor, 'crownOfDaffodilsSelfEffect');
    if (!effect?.disabled) return;
    await genericUtils.update(effect, {disabled: false});
}
export let crownOfDaffodils = {
    name: 'Crown of Daffodils',
    version: '1.3.124',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ]
};