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
 * Before a listed ability check, saving throw, skill or tool check, CAT asks whether to roll it with advantage.
 * Bound on an item or an effect. Fires on `actorContext`. An item must be equipped, and attuned if it needs attunement.
 *
 * Config:
 * - `check`: abilities whose checks get the option, including skill and tool checks that use them.
 * - `save`: saving throws the option is offered on.
 * - `skill`: skills the option is offered on.
 * - `tool`: tools the option is offered on.
 * - `statuses`: conditions that stop the option from being offered.
 * - `label`: option label, formatted with `{name}`. Blank uses the document name.
 */
export const contextAdvantage = {
    rules: 'all',
    version: '2.1.7',
    category: 'utility',
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
            label: 'CHRISPREMADES.Config.CheckAbilities',
            get options() { return constants.abilityOptions; }
        },
        save: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SaveAbilities',
            get options() { return constants.abilityOptions; }
        },
        skill: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            get options() { return constants.skillOptions; }
        },
        tool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            get options() { return constants.toolOptions; }
        },
        statuses: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.BlockingConditions',
            get options() { return constants.statusOptions; }
        },
        label: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Label'
        }
    }
};
