import {automationUtils, dataUtils, workflowUtils} from './proxy.mjs';
function addEffectMacro(effectData, {type, macroIdentifier, rules, effectIdentifier}) {
    return dataUtils.buildEffectData(effectData, {
        macros: [
            {
                type,
                macros: [
                    {
                        source: 'chris-premades',
                        identifier: macroIdentifier,
                        rules,
                        effectIdentifier
                    }
                ]
            }
        ]
    });
}
async function rollConfiguredSource(bonus, config, targets = []) {
    const item = bonus.document.documentName === 'Item' ? bonus.document : bonus.activity?.item;
    if (!item) return;
    if (config.rollItem) return await workflowUtils.completeItemUse(item, targets);
    if (!config.rollActivity) return;
    const activity = item.system.activities.get(config.rollActivity);
    if (activity) await workflowUtils.completeActivityUse(activity, targets);
}
export default {
    addEffectMacro,
    rollConfiguredSource
};
