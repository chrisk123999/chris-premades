import {activityUtils, automationUtils, dataUtils, genericUtils, itemUtils, workflowUtils} from './proxy.mjs';
const imageConfig = {
    tokenImg: {
        default: '',
        type: 'file',
        label: 'CHRISPREMADES.Config.TokenImg',
        category: 'visuals'
    },
    avatarImg: {
        default: '',
        type: 'file',
        label: 'CHRISPREMADES.Config.AvatarImg',
        category: 'visuals'
    },
    imgPriority: {
        default: 50,
        type: 'number',
        label: 'CHRISPREMADES.Config.ImgPriority',
        category: 'visuals'
    }
};
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
/**
 * Apply the document's configured avatar and token images as override changes on an effect.
 * @param {object} effectData
 * @param {foundry.abstract.Document} document The document carrying {@link imageConfig}.
 * @returns {object} The same effect data.
 */
function pushImageChanges(effectData, document) {
    const {avatarImg, tokenImg, imgPriority} = automationUtils.getConfigValues(document, Object.keys(imageConfig));
    if (avatarImg) effectData.system.changes.push({key: 'img', type: 'override', value: avatarImg, priority: imgPriority});
    if (tokenImg) effectData.system.changes.push({key: 'token.texture.src', type: 'override', value: tokenImg, priority: imgPriority});
    return effectData;
}
async function rollConfiguredSource(bonus, config, targets = []) {
    const item = bonus.document.documentName === 'Item' ? bonus.document : bonus.activity?.item;
    if (!item) return;
    if (config.rollItem) return await workflowUtils.completeItemUse(item, targets);
    if (!config.rollActivity) return;
    const activity = item.system.activities.get(config.rollActivity);
    if (activity) await workflowUtils.completeActivityUse(activity, targets);
}
async function spendScaledCost(item, activityIdentifier, amount) {
    const activity = itemUtils.getActivityByIdentifier(item, activityIdentifier);
    const activityData = activity ? activityUtils.getConsumptionModifiedActivityData(activity, amount) : undefined;
    if (!activityData) {
        genericUtils.notify('CHRISPREMADES.Error.MissingCostActivity', {type: 'warn'});
        return;
    }
    return await workflowUtils.syntheticActivityDataRoll(activityData, item, []);
}
export default {
    addEffectMacro,
    imageConfig,
    pushImageChanges,
    rollConfiguredSource,
    spendScaledCost
};
