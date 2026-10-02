import {automationUtils, dialogUtils, rollUtils, workflowUtils} from '../../../../proxy.mjs';
async function saveCheckSkill({document: item, roll}) {
    if (!item.system.uses.value) return;
    const targetValue = roll.options.target;
    if (Number.isNumeric(targetValue) && roll.total >= targetValue) return;
    if (!Number.isNumeric(targetValue) && !automationUtils.getConfigValue(item, 'noDCPrompt')) return;
    const selection = await dialogUtils.confirmUseRollTotal(item, roll.total);
    if (!selection) return;
    await workflowUtils.completeItemUse(item, [], {fast: true});
    return rollUtils.replaceD20(roll, 20);
}
async function attack({document: item, workflow}) {
    if (!workflow.attackRoll || !item.system.uses.value) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.targets.size !== 1) return;
    const targetActor = workflow.targets.first().actor;
    if ((targetActor?.system.attributes.ac.value ?? Infinity) <= workflow.attackRoll.total) return;
    const selection = await dialogUtils.confirmUseForRollTotal(item, workflow.item.name, workflow.attackRoll.total);
    if (!selection) return;
    await workflowUtils.completeItemUse(item, [], {fast: true});
    await workflow.setAttackRoll(rollUtils.replaceD20(workflow.attackRoll, 20));
}
const bonusPass = [
    {
        pass: 'actorBonus',
        macro: saveCheckSkill,
        priority: 100
    }
];
export const strokeOfLuck = {
    name: 'Stroke of Luck',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorAttackRoll',
            macro: attack,
            priority: 800
        }
    ],
    check: bonusPass,
    save: bonusPass,
    skill: bonusPass,
    tool: bonusPass,
    config: {
        noDCPrompt: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.NoDCPrompt',
            category: 'mechanics'
        }
    }
};
