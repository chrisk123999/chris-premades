import {automationUtils, constants, workflowUtils} from '../../proxy.mjs';
async function save({config, options, document, token}) {
    const activity = config.cat?.activity;
    if (!activity) return;
    const conditions = config.cat?.conditions;
    if (!conditions?.size) return;
    const validConditions = automationUtils.getGenericConfigValue(document, 'chris-premades', 'conditionAutoSave', 'conditions');
    if (!validConditions.length) return;
    const magicOnly = automationUtils.getGenericConfigValue(document, 'chris-premades', 'conditionAutoSave', 'magical');
    const magic = activity.item.type === 'spell' || activity.item.system.properties?.has('mgc');
    if (magicOnly && !magic) return;
    const hasTargetCondition = validConditions.some(condition => conditions.has(condition));
    if (!hasTargetCondition) return;
    options.minimum = Math.max(options.minimum ?? 0, options.successValue ?? 99);
    options.auto = true;
    const display = automationUtils.getGenericConfigValue(document, 'chris-premades', 'conditionAutoSave', 'display');
    if (!display) return;
    await workflowUtils.completeItemUse(document, [token]);
}
export const conditionAutoSave = {
    rules: 'all',
    version: '2.0.3',
    category: 'mechanics',
    generic: true,
    documents: ['item'],
    save: [
        {
            pass: 'actorTargetSituational',
            macro: save,
            priority: 25
        }
    ],
    genericConfig: {
        conditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Conditions',
            get options() {return constants.statusOptions;}
        },
        magical: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Magical'
        },
        display: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Display'
        }
    }
};