import {dialogUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (!workflow.targets.size|| workflow.isFumble) return;
    if (itemUtils.getConfig(item, 'promptFailOnly') && workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let rollActivity = itemUtils.getActivity(item, 'utility');
    let formula = rollActivity?.roll.formula || '1d4';
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: item.name + ' (' + formula + ')', attackTotal: workflow.attackTotal}));
    if (!selection) return;
    let result = formula;
    if (rollActivity)
        result = (await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true}))?.utilityRoll?.total || formula;
    await workflowUtils.bonusAttack(workflow, result);
}
async function saveCheckSkill({trigger: {roll, entity: item}}) {
    if (!item.system.uses.value) return;
    let targetValue = roll.options.target;
    if (itemUtils.getConfig(item, 'promptFailOnly') && targetValue && (roll.total >= targetValue)) return;
    let rollActivity = itemUtils.getActivity(item, 'utility');
    let formula = rollActivity?.roll.formula || '1d4';
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name + ' (' + formula + ')', rollTotal: roll.total}));
    if (!selection) return;
    let result = formula;
    if (rollActivity)
        result = (await workflowUtils.syntheticItemRoll(item, [], {consumeUsage: true, consumeResources: true}))?.utilityRoll?.total || formula;
    return await rollUtils.addToRoll(roll, result);
}
export let builtForSuccess = {
    name: 'Built for Success',
    version: '1.5.16',
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
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ],
    config: [
        {
            value: 'promptFailOnly',
            label: 'CHRISPREMADES.Macros.BuiltForSuccess.PromptFailOnly',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ]
};
