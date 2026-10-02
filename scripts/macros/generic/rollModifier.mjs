import {automationUtils, constants} from '../../proxy.mjs';
async function roll({document: item, config, macroClass: {identifier}, roll}) {
    if (!roll.d20) return;
    const {ability, modifier, skill, tool} = automationUtils.getGenericConfigValues(item, 'chris-premades', identifier, ['ability', 'modifier', 'skill', 'tool']);
    if (!modifier?.length) return;
    if (ability?.length && !ability.includes(roll.data.abilityId ?? config.ability)) return;
    if (skill?.length && !skill.includes(config.skill)) return;
    if (tool?.length && !tool.includes(config.tool)) return;
    const mods = modifier.split(',').map(m => m.trim());
    for (const mod of mods) {
        if (roll.d20.modifiers.includes(mod)) continue;
        roll.d20.modifiers.push(mod);
    }
    roll.resetFormula();
    return await roll.reroll();
}
export const checkModifier = {
    rules: 'all',
    version: '2.0.2',
    category: 'utility',
    generic: true,
    documents: ['activeeffect', 'item'],
    check: [
        {
            pass: 'actorBonus',
            macro: roll,
            priority: 200
        }
    ],
    genericConfig: {
        modifier: {
            default: '',
            type: 'text',
            label: 'CAT.MEDKIT.DocProps.Props.RollModifier.Field',
            hint: 'CAT.MEDKIT.DocProps.Props.RollModifier.Hint',
            category: 'behavior'
        },
        ability: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Abilities',
            get options() { return constants.abilityOptions; }
        }
    }
};
export const saveModifier = {
    rules: checkModifier.rules,
    version: checkModifier.version,
    category: checkModifier.category,
    generic: checkModifier.generic,
    documents: checkModifier.documents,
    save: checkModifier.check,
    genericConfig: checkModifier.genericConfig
};
export const skillModifier = {
    rules: checkModifier.rules,
    version: checkModifier.version,
    category: checkModifier.category,
    generic: checkModifier.generic,
    documents: checkModifier.documents,
    skill: checkModifier.check,
    genericConfig: {
        ...checkModifier.genericConfig,
        skill: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            get options() { return constants.skillOptions; }
        }
    }
};
export const toolModifier = {
    rules: checkModifier.rules,
    version: checkModifier.version,
    category: checkModifier.category,
    generic: checkModifier.generic,
    documents: checkModifier.documents,
    tool: checkModifier.check,
    genericConfig: {
        ...checkModifier.genericConfig,
        tool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            get options() { return constants.toolOptions; }
        }
    }
};
