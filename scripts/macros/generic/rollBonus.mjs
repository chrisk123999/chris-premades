import {automationUtils, constants, D20Bonus, dialogUtils, documentUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig, identifiersConfig} from './damageBonusToOneRoll.mjs';
const keyOf = (identifier, document) => identifier + '.' + document.id;
function createBonus(document, settings, holder, identifier) {
    const bonus = new D20Bonus(document, {
        formula: settings.bonus,
        phase: settings.phase === 'all' ? Object.values(constants.bonusPhases) : settings.phase,
        optional: settings.optional
    });
    if (settings.rollItem || settings.rollActivity) bonus.withOnUse(async ({bonus}) => {
        settings.storedOptionalBonus = bonus;
        if (!settings.consumeSuccessOnly) await workflowUtils.rollConfiguredSource(bonus, settings);
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
    if (!settings.bonus?.length) return;
    if (settings.ability?.length && !settings.ability.includes(config.ability)) return;
    if (settings.skill?.length && !settings.skill.includes(config.skill)) return;
    if (settings.tool?.length && !settings.tool.includes(config.tool)) return;
    if (settings.proficientOnly) {
        const trait = skillId ? actor.system.skills[skillId] : actor.system.tools?.[toolId];
        if (!(trait?.value >= 1)) return;
    }
    return createBonus(document, settings, message, identifier);
}
async function onSuccess({document, macroClass: {identifier}, message, roll}) {
    const settings = workflowUtils.getWorkflowProperty(message, keyOf(identifier, document));
    if (!settings?.consumeSuccessOnly) return;
    let consume = roll.isSuccess;
    if (!roll.isSuccess && !roll.isFailure)
        consume ||= await dialogUtils.confirm(settings.storedOptionalBonus.name, _loc('CHRISPREMADES.Macros.Generic.RollBonus.Success', {total: roll.total}));
    settings.consume = consume;
    await workflowUtils.rollConfiguredSource(settings.storedOptionalBonus, settings);
}
function attack({document, macroClass: {identifier}, workflow}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, configKeys);
    if (!settings.bonus?.length) return;
    if (settings.ability?.length && !settings.ability.includes(workflow.activity.ability)) return;
    if (settings.identifiers?.length && !settings.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return;
    if (settings.attackType && !workflowUtils.isAttackType(workflow, settings.attackType)) return;
    return createBonus(document, settings, workflow, identifier);
}
async function onHit({document, macroClass: {identifier}, workflow}) {
    const key = keyOf(identifier, document);
    const settings = workflowUtils.getWorkflowProperty(workflow, key);
    if (!settings?.consumeSuccessOnly) return;
    workflowUtils.setWorkflowProperty(workflow, key, undefined);
    settings.consume = workflow.hitTargets.size > 0;
    await workflowUtils.rollConfiguredSource(settings.storedOptionalBonus, settings);
}
const genericConfig = {
    bonus: {
        default: '',
        type: 'text',
        category: 'behavior',
        label: 'CHRISPREMADES.Config.Formula',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.BonusHint'
    },
    phase: {
        default: 'postResult',
        type: 'select',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.Phase',
        hint: 'CHRISPREMADES.Macros.Generic.Common.PhaseHint',
        get options() { return [...Object.keys(constants.bonusPhases), 'all'].map(p => ({value: p, label: _loc('CHRISPREMADES.Macros.Generic.Common.Phases.' + p)})); }
    },
    ability: {
        default: [],
        type: 'select-many',
        category: 'behavior',
        label: 'CHRISPREMADES.Config.Abilities',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.AbilityHint',
        get options() { return constants.abilityOptions; }
    },
    optional: {
        default: true,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RollBonus.Optional',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.OptionalHint'
    },
    rollActivity: {
        default: '',
        type: 'selectActivity',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity'
    },
    rollItem: {
        default: false,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.RollItem'
    },
    useActivityCosts: {
        default: false,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.Common.Costs',
        hint: 'CHRISPREMADES.Macros.Generic.RollBonus.CostsHint'
    },
    consumeSuccessOnly: {
        default: false,
        type: 'checkbox',
        category: 'behavior',
        label: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.ConsumeSuccess',
        hint: 'CHRISPREMADES.Macros.Generic.RerollWithBonus.ConsumeSuccessHint'
    }
};
const skillConfig = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Skills',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.SkillHint',
    get options() { return constants.skillOptions; }
};
const toolConfig = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Tools',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.ToolHint',
    get options() { return constants.toolOptions; }
};
const proficientOnlyConfig = {
    default: false,
    type: 'checkbox',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.RollBonus.ProficientOnly',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.ProficientOnlyHint'
};
const configKeys = [...Object.keys(genericConfig), 'skill', 'tool', 'proficientOnly', 'identifiers', 'attackType'];
const base = {
    rules: 'all',
    version: '1.1.0',
    category: 'utility',
    generic: true,
    documents: ['activeeffect', 'activity', 'item'],
    genericConfig
};
const pass = [
    {
        pass: 'actorOptionalBonus',
        macro: roll,
        priority: 250
    },
    {
        pass: 'actorPost',
        macro: onSuccess,
        priority: 300
    }
];
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
        }
    ],
    genericConfig: {...genericConfig, identifiers: identifiersConfig, attackType: attackTypeConfig}
};
export const checkBonus = {...base, check: pass};
export const saveBonus = {...base, save: pass};
export const skillBonus = {...base, skill: pass, genericConfig: {...genericConfig, skill: skillConfig, proficientOnly: proficientOnlyConfig}};
export const toolBonus = {...base, tool: pass, genericConfig: {...genericConfig, tool: toolConfig, proficientOnly: proficientOnlyConfig}};
