import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, workflowUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'specialItemUse', configKeys);
    const attackTypes = automationUtils.getConfigValue(document.item, 'attackTypes');
    const validActivity = activity => activity.canUse && !activity.flags.cat?.hidden
        && (!config.activityIdentifier || activity.identifier === config.activityIdentifier)
        && (!config.activationTypes.length || config.activationTypes.includes(activity.activation.type))
        && !config.excludeActivityTypes.includes(activity.type)
        && (!attackTypes?.length || attackTypes.includes(activity.attack?.type?.value));
    const items = config.identifiers.length ? actorUtils.getItemByIdentifiers(workflow.actor, config.identifiers, {multiple: true}) : workflow.actor.items.filter(item => config.itemTypes.includes(item.type));
    const candidates = items.filter(item => item !== document.item && (!config.equippedOnly || item.system.equipped) && item.system.activities?.some(validActivity));
    if (!candidates.length) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document.item), 'No valid item to use.');
    const item = candidates.length === 1 ? candidates[0] : await dialogUtils.selectDocumentDialog(document.item.name, 'CHRISPREMADES.Macros.Generic.SpecialItemUse.SelectItem', candidates, {sort: 'alphabetical'});
    if (!item) return;
    const activities = item.system.activities.filter(validActivity);
    const activity = activities.length === 1 ? activities[0] : await dialogUtils.selectDocumentDialog(document.item.name, 'CHRISPREMADES.Macros.Generic.SpecialItemUse.SelectActivity', activities);
    if (!activity) return;
    const targets = workflow.targets.documents;
    await workflowUtils.specialItemUse(item, targets, document.item, {activity, consumeResources: config.consumeResources});
}
/**
 * Uses an activity from another of the user's items on the same targets once the roll finishes. The user picks the item
 * and the activity when more than one qualifies. Hidden activities and activities that cannot be used are skipped. An
 * `attackTypes` config on this item limits the choice to attack activities of those attack types.
 */
export const specialItemUse = {
    rules: 'all',
    version: '2.1.9',
    category: 'uses',
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
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.Identifiers.Hint'
        },
        itemTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ItemTypes.Hint',
            get options() { return constants.usableItemTypes; }
        },
        equippedOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.EquippedOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.EquippedOnly.Hint'
        },
        activityIdentifier: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivityIdentifier.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivityIdentifier.Hint'
        },
        activationTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivationTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ActivationTypes.Hint',
            get options() { return constants.activationTypeOptions; }
        },
        excludeActivityTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ExcludeActivityTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ExcludeActivityTypes.Hint',
            get options() { return constants.activityTypeOptions; }
        },
        consumeResources: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ConsumeResources.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SpecialItemUse.ConsumeResources.Hint'
        }
    }
};
const configKeys = Object.keys(specialItemUse.genericConfig);
