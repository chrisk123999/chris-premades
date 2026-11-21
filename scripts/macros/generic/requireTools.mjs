import {actorUtils, automationUtils, constants, genericUtils} from '../../proxy.mjs';
async function check({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'requireTools', configKeys);
    if (!config.tools.length || actorUtils.hasTools(workflow.actor, config.tools, {equipped: config.equipped})) return;
    const tools = constants.toolOptions.filter(option => config.tools.includes(option.value)).map(option => option.label).join(', ');
    genericUtils.notify('CHRISPREMADES.Macros.Generic.RequireTools.Missing', {type: 'warn', format: {feature: activity.item.name, tools}});
    workflow.aborted = true;
    return true;
}
/**
 * Cancels this activity unless its user has one of the listed tools.
 * Bound on an activity. Fires on `activityPreItemRoll`, and on `castEnchantmentPreItemRoll` for spells cast through it.
 *
 * Config:
 * - `tools`: tools that satisfy the requirement. Any one is enough.
 * - `equipped`: the tool must be equipped, standing in for "in hand".
 */
export const requireTools = {
    rules: 'all',
    version: '2.1.11',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: check,
            priority: 10
        },
        {
            pass: 'castEnchantmentPreItemRoll',
            macro: check,
            priority: 10
        }
    ],
    genericConfig: {
        tools: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            get options() { return constants.toolOptions; }
        },
        equipped: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RequireTools.Equipped',
            hint: 'CHRISPREMADES.Macros.Generic.RequireTools.EquippedHint'
        }
    }
};
const configKeys = Object.keys(requireTools.genericConfig);
