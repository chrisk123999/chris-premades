import {activityUtils, actorUtils, automationUtils, constants, dialogUtils, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function reroll({actor, config, dialog, document: item, message, roll, macroClass: {identifier}, checkId, saveId, skillId, toolId}, nearby = false) {
    const settings = automationUtils.getGenericConfigValues(item, 'chris-premades', identifier, configKeys);
    if (nearby !== !!settings.distance) return;
    if (settings.failedOnly && (roll.isSuccess || !Number.isNumeric(roll.options.target))) return;
    const activity = item.system.activities.get(settings.rollActivity);
    const prompts = !!(activity && settings.consume);
    if ((settings.oncePerRoll || !prompts) && workflowUtils.getWorkflowProperty(config, identifier)) return;
    if (settings.ability?.length && !settings.ability.includes(config.ability)) return;
    if (settings.skill?.length && !settings.skill.includes(config.skill)) return;
    if (settings.tool?.length && !settings.tool.includes(config.tool)) return;
    if (nearby && !activity) return;
    if (activity && (settings.consume || nearby)) {
        if (!activityUtils.checkCosts(activity)) return;
        const userId = queryUtils.firstOwner(item.actor, true);
        if (!await (nearby ? dialogUtils.confirmUseForRollTotal(item, actor.name, roll.total, {userId}) : dialogUtils.confirmUseRollTotal(item, roll.total, {userId}))) return;
    }
    const rerollConfig = {...config};
    const rerollDialog = {...dialog, configure: false};
    const rerollMessage = {...message, create: false};
    if (settings.bonus?.length) {
        rerollConfig.rolls ??= [];
        rerollConfig.rolls.push({parts: [nearby ? Roll.replaceFormulaData(settings.bonus, item.getRollData()) : settings.bonus]});
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
    if (activity) await workflowUtils.syntheticActivityRoll(activity, [], {consumeResources: consume});
    else if (settings.rollItem) await workflowUtils.syntheticItemRoll(item, [], {consumeResources: consume});
    return rollUtils.replaceRollShowDiscarded(roll, newRoll);
}
const genericConfig = {
    bonus: {
        default: '',
        type: 'formula',
        category: 'behavior',
        label: 'CHRISPREMADES.Config.Formula',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Bonus.Hint'
    },
    ability: {
        default: [],
        type: 'select-many',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.Abilities',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Ability.Hint',
        get options() { return constants.abilityOptions; }
    },
    failedOnly: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Failed.Label',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Failed.Hint'
    },
    oncePerRoll: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Once.Label',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Once.Hint'
    },
    consume: {
        default: false,
        type: 'select',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Consume.Label',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Consume.Hint',
        options: [
            {label: 'CHRISPREMADES.Config.None', value: false},
            {label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Consume.Label', value: 'always'},
            {label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.ConsumeSuccess.Label', value: 'success'}
        ]
    },
    rollActivity: {
        default: '',
        type: 'selectActivity',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
        hint: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Hint'
    },
    rollItem: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollItem.Label',
        hint: 'CHRISPREMADES.Macros.Generic.Common.RollItem.Hint'
    }
};
const skill = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Skills',
    hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Skill.Hint',
    get options() { return constants.skillOptions; }
};
const tool = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Tools',
    hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Tool.Hint',
    get options() { return constants.toolOptions; }
};
genericConfig.distance = {
    default: 0,
    type: 'number',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Distance.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.Distance.Hint'
};
const configKeys = [...Object.keys(genericConfig), 'skill', 'tool'];
async function nearbyReroll(data) {
    const owner = data.document.actor;
    if (!owner || owner === data.actor || actorUtils.hasUsedReaction(owner)) return;
    const ownerToken = actorUtils.getFirstToken(owner);
    const token = actorUtils.getFirstToken(data.actor);
    if (!ownerToken || !token || !tokenUtils.canSee(ownerToken, token)) return;
    return reroll(data, true);
}
const base = {
    rules: 'all',
    version: '2.1.11',
    category: 'behavior',
    generic: true,
    documents: ['item'],
    genericConfig
};
const pass = [
    {
        pass: 'actorBonus',
        macro: reroll,
        priority: 300
    },
    {
        pass: 'nearbyBonus',
        macro: nearbyReroll,
        priority: 300,
        configDistance: 'distance',
        dispositions: ['ally'],
        disabled: ['incapacitated']
    }
];
/**
 * Rerolls a d20 roll with an added bonus and keeps the new result, with one variant each for ability checks, saving
 * throws, skill checks and tool checks. The discarded roll stays visible on the chat card. When the reroll consumes the
 * roll activity's costs, the owner confirms first and the reroll is skipped if the costs can't be paid. With an Ally
 * Range, the reroll is offered on allies' rolls within that range instead of the owner's.
 */
export const rerollCheckWithBonus = {...base, check: pass};
export const rerollSaveWithBonus = {...base, save: pass};
export const rerollSkillWithBonus = {...base, skill: pass, genericConfig: {...genericConfig, skill}};
export const rerollToolWithBonus = {...base, tool: pass, genericConfig: {...genericConfig, tool}};
