import {activityUtils, actorUtils, automationUtils, constants, D20Bonus, dataUtils, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig, identifiersConfig} from './damageBonusToOneRoll.mjs';
const keyOf = (identifier, document) => identifier + '.' + document.id;
const getOwner = document => document.actor ?? (document.parent?.documentName === 'Actor' ? document.parent : document.parent?.actor);
const getRange = settings => Number(settings.enemyRange) || Number(settings.range) || 0;
function inReach(owner, token, settings) {
    const ownerToken = actorUtils.getFirstToken(owner);
    if (!ownerToken || !token || ownerToken.parent !== token.parent) return false;
    const disposition = settings.enemyRange ? 'enemy' : settings.disposition;
    if (disposition === 'enemy' && !tokenUtils.isEnemy(ownerToken, token)) return false;
    if (disposition === 'ally' && tokenUtils.isEnemy(ownerToken, token)) return false;
    return tokenUtils.isWithinDistance(ownerToken, token, getRange(settings)) && tokenUtils.canSee(ownerToken, token);
}
function createBonus(document, settings, holder, identifier, roll, {targetActor, targets} = {}) {
    const item = document.documentName === 'Activity' ? document.item : document;
    for (const id of [settings.rollActivity, settings.failActivity]) {
        const activity = id ? item?.system?.activities?.get(id) : undefined;
        if (activity && !activityUtils.checkCosts(activity)) return;
    }
    const bonus = new D20Bonus(document, {
        phase: settings.phase === 'all' ? Object.values(constants.bonusPhases) : settings.phase,
        optional: settings.optional,
        roll,
        targetActor
    });
    if (settings.rollItem || settings.rollActivity) bonus.withOnUse(async ({bonus}) => {
        settings.storedOptionalBonus = bonus;
        if (!settings.consumeSuccessOnly) await workflowUtils.rollConfiguredSource(bonus, settings, targets);
        else workflowUtils.setWorkflowProperty(holder, keyOf(identifier, document), settings);
    });
    if (settings.useActivityCosts) {
        bonus.withDefaultCosts().initialize();
        if (!D20Bonus.CheckCost(bonus)) return;
    }
    return bonus;
}
function roll({document, config, macroClass: {identifier}, message, actor, skillId, toolId}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, configKeys);
    if (!settings.bonus?.length || getRange(settings)) return;
    if (settings.ability?.length && !settings.ability.includes(config.ability)) return;
    if (settings.skill?.length && !settings.skill.includes(config.skill)) return;
    if (settings.tool?.length && !settings.tool.includes(config.tool)) return;
    if (settings.proficientOnly) {
        const trait = skillId ? actor.system.skills[skillId] : actor.system.tools?.[toolId];
        if (!(trait?.value >= 1)) return;
    }
    const roll = new D20Bonus.rollClass(settings.bonus, dataUtils.getFormulaData({document, workflow: config.midiOptions?.workflow}));
    return createBonus(document, settings, message, identifier, roll);
}
function otherRoll({document, config, macroClass: {identifier}, message, token}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, configKeys);
    const owner = getOwner(document);
    const actor = token?.actor;
    if (!settings.bonus?.length || !getRange(settings) || !owner || !actor || (actor === owner && !settings.includeOwner) || owner.statuses.has('incapacitated')) return;
    if (settings.ability?.length && !settings.ability.includes(config.ability)) return;
    if (settings.skill?.length && !settings.skill.includes(config.skill)) return;
    if (settings.tool?.length && !settings.tool.includes(config.tool)) return;
    if (!inReach(owner, token, settings) || actorUtils.hasUsedReaction(owner)) return;
    const roll = new D20Bonus.rollClass(settings.bonus, dataUtils.getFormulaData({document, workflow: config.midiOptions?.workflow}));
    return createBonus(document, settings, message, identifier, roll, {targetActor: actor})?.withDefaultRequest();
}
async function onSuccess({document, macroClass: {identifier}, message, roll}) {
    const settings = workflowUtils.getWorkflowProperty(message, keyOf(identifier, document));
    if (!settings?.consumeSuccessOnly) return;
    let consume = roll.isSuccess;
    if (!roll.isSuccess && !roll.isFailure)
        consume ||= await dialogUtils.confirm(settings.storedOptionalBonus.name, _loc('CHRISPREMADES.Macros.Generic.RollBonus.Success', {total: roll.total}));
    settings.consume = consume;
    await workflowUtils.rollConfiguredSource(settings.storedOptionalBonus, settings);
    if (!consume && settings.failActivity) await workflowUtils.rollConfiguredSource(settings.storedOptionalBonus, {rollActivity: settings.failActivity, consume: true});
}
function attack({document, macroClass: {identifier}, workflow}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, configKeys);
    if (!settings.bonus?.length || getRange(settings)) return;
    if (settings.ability?.length && !settings.ability.includes(workflow.activity.ability)) return;
    if (settings.identifiers?.length && !settings.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return;
    if (settings.attackType && !workflowUtils.isAttackType(workflow, settings.attackType)) return;
    const roll = new D20Bonus.rollClass(settings.bonus, dataUtils.getFormulaData({document, workflow}));
    return createBonus(document, settings, workflow, identifier, roll);
}
function enemyAttack({document, macroClass: {identifier}, workflow}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, configKeys);
    const owner = getOwner(document);
    if (!settings.bonus?.length || !getRange(settings) || !owner || !workflow.token || (workflow.actor === owner && !settings.includeOwner) || owner.statuses.has('incapacitated')) return;
    if (settings.attackType && !workflowUtils.isAttackType(workflow, settings.attackType)) return;
    if (settings.immuneCondition && actorUtils.checkTrait(workflow.actor, 'ci', settings.immuneCondition)) return;
    const roll = new D20Bonus.rollClass(settings.bonus, dataUtils.getFormulaData({document, workflow}));
    if (settings.autoEffect.some(identifier => documentUtils.getEffectByIdentifier(workflow.actor, identifier, {sourceActor: owner}))) return new D20Bonus(document, {phase: settings.phase === 'all' ? Object.values(constants.bonusPhases) : settings.phase, optional: false, roll});
    if (actorUtils.hasUsedReaction(owner) || !inReach(owner, workflow.token.document, settings)) return;
    return createBonus(document, settings, workflow, identifier, roll, {targets: [workflow.token.document]})?.withDefaultRequest();
}
async function onHit({document, macroClass: {identifier}, workflow}) {
    const key = keyOf(identifier, document);
    const settings = workflowUtils.getWorkflowProperty(workflow, key);
    if (!settings?.consumeSuccessOnly) return;
    workflowUtils.setWorkflowProperty(workflow, key, undefined);
    settings.consume = workflow.hitTargets.count > 0;
    await workflowUtils.rollConfiguredSource(settings.storedOptionalBonus, settings);
    if (!settings.consume && settings.failActivity) await workflowUtils.rollConfiguredSource(settings.storedOptionalBonus, {rollActivity: settings.failActivity, consume: true});
}
const genericConfig = {
    bonus: {
        default: '',
        type: 'formula',
        category: 'behavior',
        label: 'CHRISPREMADES.Config.Formula',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Bonus.Hint'
    },
    phase: {
        default: 'postResult',
        type: 'select',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.Phase.Label',
        hint: 'CHRISPREMADES.Macros.Generic.Common.Phase.Hint',
        get options() { return constants.bonusPhaseOptions; }
    },
    ability: {
        default: [],
        type: 'select-many',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.Abilities',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Ability.Hint',
        get options() { return constants.abilityOptions; }
    },
    optional: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RollBonus.Optional.Label',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Optional.Hint'
    },
    rollActivity: {
        default: '',
        type: 'selectActivity',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
        hint: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Hint'
    },
    rollItem: {
        default: false,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollItem.Label',
        hint: 'CHRISPREMADES.Macros.Generic.Common.RollItem.Hint'
    },
    useActivityCosts: {
        default: false,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.Costs',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Costs.Hint'
    },
    failActivity: {
        default: '',
        type: 'selectActivity',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RollBonus.FailActivity.Label',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.FailActivity.Hint'
    },
    consumeSuccessOnly: {
        default: false,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.ConsumeSuccess.Label',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.ConsumeSuccess.Hint'
    }
};
const skillConfig = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Skills',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Skill.Hint',
    get options() { return constants.skillOptions; }
};
const toolConfig = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Tools',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Tool.Hint',
    get options() { return constants.toolOptions; }
};
const proficientOnlyConfig = {
    default: false,
    type: 'checkbox',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.ProficientOnly.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.ProficientOnly.Hint'
};
const enemyRangeConfig = {
    default: 0,
    type: 'number',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.EnemyRange.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.EnemyRange.Hint'
};
const autoEffectConfig = {
    default: [],
    type: 'selectIdentifiers',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.AutoEffect.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.AutoEffect.Hint'
};
const immuneConditionConfig = {
    default: '',
    type: 'select',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.ImmuneCondition.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.ImmuneCondition.Hint',
    get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.statusOptions]; }
};
const rangeConfig = {
    default: 0,
    type: 'number',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.Range.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Range.Hint'
};
const dispositionConfig = {
    default: 'enemy',
    type: 'select',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Hint',
    options: [
        {label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Enemy', value: 'enemy'},
        {label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Ally', value: 'ally'},
        {label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Any', value: 'any'}
    ]
};
genericConfig.range = rangeConfig;
genericConfig.disposition = dispositionConfig;
genericConfig.includeOwner = {
    default: false,
    type: 'checkbox',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.IncludeOwner.Label',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.IncludeOwner.Hint'
};
const configKeys = [...Object.keys(genericConfig), 'skill', 'tool', 'proficientOnly', 'identifiers', 'attackType', 'enemyRange', 'autoEffect', 'immuneCondition'];
const base = {
    rules: 'all',
    version: '2.1.11',
    category: 'behavior',
    generic: true,
    documents: ['activeeffect', 'activity', 'item'],
    genericConfig
};
const pass = [
    {
        pass: 'actorOptionalBonus',
        macro: roll,
        priority: 250,
        canOverlap: true
    },
    {
        pass: 'actorPost',
        macro: onSuccess,
        priority: 300
    },
    {
        pass: 'sceneOptionalBonus',
        macro: otherRoll,
        priority: 250,
        canOverlap: true
    }
];
/**
 * Offers a bonus formula on a d20 roll, with one variant each for attack rolls, ability checks, saving throws, skill
 * checks and tool checks. The bonus can be optional or always applied, and can roll an activity or item when it's used.
 * The attack variant can instead be offered to the owner when a nearby enemy it can see attacks, and any variant can be
 * offered on rolls made by other creatures within range, while the owner still has its reaction.
 */
export const attackBonus = {
    ...base,
    roll: [
        {
            pass: 'actorOptionalBonusAttack',
            macro: attack,
            priority: 250
        },
        {
            pass: 'actorAttackRollComplete',
            macro: onHit,
            priority: 300
        },
        {
            pass: 'sceneOptionalBonusAttack',
            macro: enemyAttack,
            priority: 250,
            canOverlap: true
        }
    ],
    genericConfig: {...genericConfig, identifiers: identifiersConfig, attackType: attackTypeConfig, enemyRange: enemyRangeConfig, autoEffect: autoEffectConfig, immuneCondition: immuneConditionConfig}
};
export const checkBonus = {...base, check: pass};
export const saveBonus = {...base, save: pass};
export const skillBonus = {...base, skill: pass, genericConfig: {...genericConfig, skill: skillConfig, proficientOnly: proficientOnlyConfig}};
export const toolBonus = {...base, tool: pass, genericConfig: {...genericConfig, tool: toolConfig, proficientOnly: proficientOnlyConfig}};
