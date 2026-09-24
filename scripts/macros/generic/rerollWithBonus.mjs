import {automationUtils, constants, dialogUtils, rollUtils, workflowUtils} from '../../proxy.mjs';
async function reroll({actor, config, dialog, document: item, message, roll, macroClass: {identifier}, checkId, saveId, skillId, toolId}) {
    const settings = automationUtils.getGenericConfigValues(item, 'chris-premades', identifier, configKeys);
    if (settings.failedOnly && roll.isSuccess) return;
    if (settings.oncePerRoll && workflowUtils.getWorkflowProperty(config, identifier)) return;
    if (settings.ability?.length && !settings.ability.includes(config.ability)) return;
    if (settings.skill?.length && !settings.skill.includes(config.skill)) return;
    if (settings.tool?.length && !settings.tool.includes(config.tool)) return;
    if (settings.consume) {
        if (!item.system.uses.value) return;
        if (!await dialogUtils.confirmUseRollTotal(item, roll.total)) return;
    }
    const rerollConfig = {...config};
    const rerollDialog = {...dialog, configure: false};
    const rerollMessage = {...message, create: false};
    if (settings.bonus?.length) {
        rerollConfig.rolls ??= [];
        rerollConfig.rolls.push({parts: [settings.bonus]});
    }
    workflowUtils.setWorkflowProperty(rerollConfig, identifier, true);
    let newRoll;
    if (checkId) newRoll = (await actor.rollAbilityCheck(rerollConfig, rerollDialog, rerollMessage))?.[0];
    else if (saveId) newRoll = (await actor.rollSavingThrow(rerollConfig, rerollDialog, rerollMessage))?.[0];
    else if (skillId) newRoll = (await actor.rollSkill(rerollConfig, rerollDialog, rerollMessage))?.[0];
    else if (toolId) newRoll = (await actor.rollToolCheck(rerollConfig, rerollDialog, rerollMessage))?.[0];
    if (!newRoll) return roll;
    let consume = !!settings.consume;
    if (settings.consume === 'success' && !newRoll.isSuccess) consume = false;
    const activity = item.system.activities.get(settings.rollActivity);
    if (activity) await workflowUtils.syntheticActivityRoll(activity, [], {consumeResources: consume, consumeUsage: consume});
    else if (settings.rollItem) await workflowUtils.syntheticItemRoll(item, [], {consumeResources: consume, consumeUsage: consume});
    return rollUtils.replaceRollShowDiscarded(roll, newRoll);
}
const genericConfig = {
    bonus: {
        default: '',
        type: 'text',
        category: 'behavior',
        label: 'CHRISPREMADES.Config.Formula',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.BonusHint'
    },
    ability: {
        default: [],
        type: 'select-many',
        category: 'behavior',
        label: 'CHRISPREMADES.Config.Abilities',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.AbilityHint',
        get options() { return constants.abilityOptions(); }
    },
    failedOnly: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Failed',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.FailedHint'
    },
    oncePerRoll: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Once',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.OnceHint'
    },
    consume: {
        default: false,
        type: 'select',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Consume',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.CostsHint',
        options: [
            {label: 'CHRISPREMADES.Config.None', value: false},
            {label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Consume', value: 'always'},
            {label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.ConsumeSuccess', value: 'success'}
        ]
    },
    rollActivity: {
        default: '',
        type: 'selectActivity',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity'
    },
    rollItem: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollItem'
    }
};
const skill = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Skills',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.SkillHint',
    get options() { return constants.skillOptions(); }
};
const tool = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Tools',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.ToolHint',
    get options() { return constants.toolOptions(); }
};
const configKeys = [...Object.keys(genericConfig), 'skill', 'tool'];
const base = {
    rules: 'all',
    version: '2.0.4',
    category: 'utility',
    generic: true,
    documents: ['item'],
    genericConfig
};
const pass = [
    {
        pass: 'actorBonus',
        macro: reroll,
        priority: 300
    }
];
export const rerollCheckWithBonus = {...base, check: pass};
export const rerollSaveWithBonus = {...base, save: pass};
export const rerollSkillWithBonus = {...base, skill: pass, genericConfig: {...genericConfig, skill}};
export const rerollToolWithBonus = {...base, tool: pass, genericConfig: {...genericConfig, tool}};
