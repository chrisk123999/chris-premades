import {constants, dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function saveCheckSkill({trigger: {entity: item, config, roll}}) {
    if (!item.system.uses.value) return;
    let targetValue = config?.midiOptions?.targetValue;
    if (targetValue && (roll.total >= targetValue)) return;
    if (!targetValue && !itemUtils.getConfig(item, 'noDCPrompt')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name, rollTotal: roll.total}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true});
    return await rollUtils.replaceD20(roll, 20);
}
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.activity) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!item.system.uses.value) return;
    if (workflow.targets.size !== 1) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Missed', {attackTotal: workflow.attackTotal, itemName: item.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true});
    let roll = await rollUtils.replaceD20(workflow.attackRoll, 20);
    await workflow.setAttackRoll(roll);
}
export let strokeOfLuck = {
    name: 'Stroke of Luck',
    version: '1.3.37',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50
            }
        ]
    },
    save: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 250
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 250
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 250
        }
    ],
    config: [
        {
            value: 'noDCPrompt',
            label: 'CHRISPREMADES.Config.NoDCPrompt',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ]
};