import {automationUtils, constants, itemUtils} from '../../proxy.mjs';
function context({document, skillId, toolId}) {
    if (!itemUtils.getEquipmentState(document)) return;
    const {skill, tool, label} = automationUtils.getGenericConfigValues(document, 'chris-premades', 'contextAdvantage', ['skill', 'tool', 'label']);
    if (!(skillId ? skill.includes(skillId) : tool.includes(toolId))) return;
    return {label: label ? _loc(label) : document.name, type: 'advantage'};
}
/**
 * Before a listed skill or tool check, CAT asks whether to roll it with advantage.
 * Bound on an item or an effect. Fires on `actorContext`. An item must be equipped, and attuned if it needs attunement.
 *
 * Config:
 * - `skill`: skills the option is offered on.
 * - `tool`: tools the option is offered on.
 * - `label`: option label. Blank uses the document name.
 */
export const contextAdvantage = {
    rules: 'all',
    version: '2.1.7',
    category: 'utility',
    generic: true,
    documents: ['activeeffect', 'item'],
    skill: [
        {
            pass: 'actorContext',
            macro: context,
            priority: 50
        }
    ],
    tool: [
        {
            pass: 'actorContext',
            macro: context,
            priority: 50
        }
    ],
    genericConfig: {
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
        label: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Label'
        }
    }
};
