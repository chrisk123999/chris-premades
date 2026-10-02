import {actorUtils, automationUtils, constants, dialogUtils, workflowUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'specialItemUse', configKeys);
    const validActivity = activity => activity.canUse && !activity.flags.cat?.hidden
        && (!config.activityIdentifier || activity.identifier === config.activityIdentifier)
        && (!config.activationTypes.length || config.activationTypes.includes(activity.activation.type))
        && !config.excludeActivityTypes.includes(activity.type);
    const items = config.identifiers.length ? actorUtils.getItemByIdentifiers(workflow.actor, config.identifiers, {multiple: true}) : workflow.actor.items.filter(item => config.itemTypes.includes(item.type));
    const candidates = items.filter(item => item !== document.item && (!config.equippedOnly || item.system.equipped) && item.system.activities?.some(validActivity));
    if (!candidates.length) return;
    const item = candidates.length === 1 ? candidates[0] : await dialogUtils.selectDocumentDialog(document.item.name, 'CHRISPREMADES.Macros.Generic.SpecialItemUse.SelectItem', candidates, {sort: 'alphabetical'});
    if (!item) return;
    const activities = item.system.activities.filter(validActivity);
    const activity = activities.length === 1 ? activities[0] : await dialogUtils.selectDocumentDialog(document.item.name, 'CHRISPREMADES.Macros.Generic.SpecialItemUse.SelectActivity', activities);
    if (!activity) return;
    const targets = Array.from(workflow.targets).map(token => token.document ?? token);
    await workflowUtils.specialItemUse(item, targets, document.item, {activity, consumeUsage: config.consumeUsage, consumeResources: config.consumeResources});
}
export const specialItemUse = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        identifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.IdentifiersHint'
        },
        itemTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ItemTypesHint',
            get options() { return constants.usableItemTypes; }
        },
        equippedOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.EquippedOnly'
        },
        activityIdentifier: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivityIdentifier',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivityIdentifierHint'
        },
        activationTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivationTypes',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivationTypesHint',
            get options() { return constants.activationTypeOptions; }
        },
        excludeActivityTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ExcludeActivityTypes',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ExcludeActivityTypesHint',
            get options() { return constants.activityTypeOptions; }
        },
        consumeUsage: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ConsumeUsage',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ConsumeUsageHint'
        },
        consumeResources: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ConsumeResources',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ConsumeResourcesHint'
        }
    }
};
const configKeys = Object.keys(specialItemUse.genericConfig);
