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
 * Cancels the activity, and spells cast through it, unless the user has one of the listed tools. A warning names the
 * missing tools.
 */
export const requireTools = {
    rules: 'all',
    version: '2.1.11',
    category: 'mechanics',
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
            hint: 'CHRISPREMADES.Macros.Generic.RequireTools.Tools.Hint',
            get options() { return constants.toolOptions; }
        },
        equipped: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RequireTools.Equipped.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RequireTools.Equipped.Hint'
        }
    }
};
const configKeys = Object.keys(requireTools.genericConfig);
