import {dialogUtils, itemUtils, rollUtils, socketUtils} from '../../../utils.js';

async function saveContext({trigger: {entity: item, saveId}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'contextualBonus');
    if (!config.advantage) return;
    if (!config.saves.includes(saveId)) return;
    return {label: config.condition, type: 'advantage'};
}
async function checkContext({trigger: {entity: item, checkId}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'contextualBonus');
    if (!config.advantage) return;
    if (!config.checks.includes(checkId)) return;
    return {label: config.condition, type: 'advantage'};
}
async function skillContext({trigger: {entity: item, skillId}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'contextualBonus');
    if (!config.advantage) return;
    if (!config.skills.includes(skillId)) return;
    return {label: config.condition, type: 'advantage'};
}
async function saveBonus({trigger: {entity: item, roll, saveId}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'contextualBonus');
    if (config.advantage) return;
    if (!config.saves.includes(saveId)) return;
    let selection = await dialogUtils.confirm(item.name, config.condition, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    return rollUtils.addToRoll(roll, config.bonus, {rollData: roll.data});
}
async function checkBonus({trigger: {entity: item, roll, checkId}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'contextualBonus');
    if (config.advantage) return;
    if (!config.checks.includes(checkId)) return;
    let selection = await dialogUtils.confirm(item.name, config.condition, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    return rollUtils.addToRoll(roll, config.bonus, {rollData: roll.data});
}
async function skillBonus({trigger: {entity: item, roll, skillId}}) {
    let config = itemUtils.getGenericFeatureConfig(item, 'contextualBonus');
    if (config.advantage) return;
    if (!config.skills.includes(skillId)) return;
    let selection = await dialogUtils.confirm(item.name, config.condition, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    return rollUtils.addToRoll(roll, config.bonus, {rollData: roll.data});
}
export let contextualBonus = {
    name: 'Contextual Bonus',
    version: '0.12.84',
    save: [
        {
            pass: 'context',
            macro: saveContext,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: saveBonus,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'context',
            macro: checkContext,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: checkBonus,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'context',
            macro: skillContext,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: skillBonus,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'saves',
            label: 'CHRISPREMADES.Macros.ContextualBonus.Saves',
            type: 'abilities',
            default: []
        },
        {
            value: 'checks',
            label: 'CHRISPREMADES.Macros.ContextualBonus.Checks',
            type: 'abilities',
            default: []
        },
        {
            value: 'skills',
            label: 'CHRISPREMADES.Macros.ContextualBonus.Skills',
            type: 'skills',
            default: []
        },
        {
            value: 'condition',
            label: 'CHRISPREMADES.Macros.ContextualBonus.Condition',
            type: 'text',
            default: ''
        },
        {
            value: 'advantage',
            label: 'CHRISPREMADES.Macros.ContextualBonus.Advantage',
            type: 'checkbox',
            default: true
        },
        {
            value: 'bonus',
            label: 'CHRISPREMADES.Macros.ContextualBonus.Bonus',
            type: 'text',
            default: ''
        }
    ]
};