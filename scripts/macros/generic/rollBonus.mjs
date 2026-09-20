import {automationUtils, constants, D20Bonus} from '../../proxy.mjs';
import utils from '../../utils.mjs';
function roll({document, config, macroClass: {identifier}}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', identifier, configKeys);
    if (!settings.bonus?.length) return;
    if (settings.ability?.length && !settings.ability.includes(config.ability)) return;
    if (settings.skill?.length && !settings.skill.includes(config.skill)) return;
    if (settings.tool?.length && !settings.tool.includes(config.tool)) return;
    const bonus = new D20Bonus(document, {
        formula: settings.bonus,
        phase: settings.phase === 'all' ? Object.values(constants.bonusPhases) : settings.phase,
        optional: settings.optional
    });
    if (settings.rollItem || settings.rollActivity) bonus.withOnUse(async ({bonus}) => await utils.rollConfiguredSource(bonus, settings));
    if (settings.useActivityCosts) {
        bonus.withDefaultCosts().initialize();
        if (!D20Bonus.CheckCost(bonus)) return;
    }
    return bonus;
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
        get options() { return constants.abilityOptions(); }
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
    }
};
const skillConfig = {
    default: [],
    type: 'select-many',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Skills',
    hint: 'CHRISPREMADES.Macros.Generic.RollBonus.SkillHint',
    get options() { return constants.skillOptions(); }
};
const toolConfig = {
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
    version: '1.0.0',
    category: 'utility',
    generic: true,
    documents: ['activeeffect', 'item'],
    genericConfig
};
const pass = [
    {
        pass: 'actorOptionalBonus',
        macro: roll,
        priority: 250
    }
];
export const checkBonus = {...base, check: pass};
export const saveBonus = {...base, save: pass};
export const skillBonus = {...base, skill: pass, genericConfig: {...genericConfig, skill: skillConfig}};
export const toolBonus = {...base, tool: pass, genericConfig: {...genericConfig, tool: toolConfig}};
