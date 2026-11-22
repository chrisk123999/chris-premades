import {automationUtils, constants, itemUtils} from '../../proxy.mjs';
function context({actor, config, document, options, saveId, skillId, toolId}) {
    if (config.advantage || options.advantage || !itemUtils.getEquipmentState(document)) return;
    const {check, save, skill, tool, statuses, label} = automationUtils.getGenericConfigValues(document, 'chris-premades', 'contextAdvantage', ['check', 'save', 'skill', 'tool', 'statuses', 'label']);
    if (actor.statuses.some(status => statuses.includes(status))) return;
    const matches = saveId ? save.includes(saveId) : check.includes(config.ability) || skill.includes(skillId) || tool.includes(toolId);
    if (!matches) return;
    return {label: label ? _loc(label, {name: document.name}) : document.name, type: 'advantage'};
}
const contextPass = [
    {
        pass: 'actorContext',
        macro: context,
        priority: 50
    }
];
/**
 * Offers advantage as a roll option on the chosen ability checks, saving throws, skill checks and tool checks. An item
 * must be equipped, and attuned if it needs attunement. The option is not offered when the roll already has advantage.
 */
export const contextAdvantage = {
    rules: 'all',
    version: '2.1.7',
    category: 'rolls',
    generic: true,
    documents: ['activeeffect', 'item'],
    check: contextPass,
    save: contextPass,
    skill: contextPass,
    tool: contextPass,
    genericConfig: {
        check: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.CheckAbilities',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Check.Hint',
            get options() { return constants.abilityOptions; }
        },
        save: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.SaveAbilities',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Save.Hint',
            get options() { return constants.abilityOptions; }
        },
        skill: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Skill.Hint',
            get options() { return constants.skillOptions; }
        },
        tool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Tool.Hint',
            get options() { return constants.toolOptions; }
        },
        statuses: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.BlockingConditions',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Statuses.Hint',
            get options() { return constants.statusOptions; }
        },
        label: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Label.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Label.Hint'
        }
    }
};
