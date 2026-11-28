import {activityUtils, automationUtils, dialogUtils, documentUtils, Logging, workflowUtils} from '../../proxy.mjs';
function isOwnUses(item, target) {
    return target.type === 'itemUses' && (!target.target || target.target === item.id);
}
async function early({document, activity, config}) {
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', 'restoreUses', configKeys);
    const restoreActivity = document.system.activities.get(settings.restoreActivity) ?? document.system.activities.find(i => activityUtils.getRecoveryPools(i).some(pool => pool.document === document));
    if (!restoreActivity) return;
    const uses = document.system.uses;
    if (activity.id === restoreActivity.id) {
        if (!uses.spent) {
            Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(document), 'CHRISPREMADES.Macros.Generic.RestoreUses.NoneSpent', {notify: 'info', format: {item: document.name}});
            return true;
        }
        if (settings.requireEmpty && uses.value) {
            Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(document), 'CHRISPREMADES.Macros.Generic.RestoreUses.NotEmpty', {notify: 'info', format: {item: document.name}});
            return true;
        }
        return;
    }
    if (!settings.offerRestore || uses.value || config.consume === false || config.consume?.resources === false) return;
    if (!activity.consumption.targets.some(target => isOwnUses(document, target) && Number(target.value) > 0)) return;
    const cost = restoreActivity.consumption.targets.find(target => !isOwnUses(document, target));
    const pool = cost?.type === 'itemUses' ? document.actor.items.get(cost.target) : undefined;
    if (pool && pool.system.uses.value < Number(cost.value)) return;
    const selection = cost ? await dialogUtils.confirmUseExtraCost(document, cost.value, pool?.name ?? restoreActivity.name) : await dialogUtils.confirmUseItem(restoreActivity);
    if (!selection) return true;
    await workflowUtils.completeActivityUse(restoreActivity);
    const freshActivity = document.actor.items.get(document.id)?.system.activities.get(activity.id);
    if (!freshActivity) return true;
    const targets = new MidiQOL.TokenDocumentSet(config.midiOptions?.targetsToUse ?? []).documents;
    await workflowUtils.completeActivityUse(freshActivity, targets, {config});
    return true;
}
/**
 * Controls when this item's restore activity can be used, and offers to run it when another activity needs a use and
 * none remain. The restore activity is blocked while no uses are spent. After an offered restore, the original
 * activity is used again.
 */
export const restoreUses = {
    rules: 'all',
    version: '2.1.9',
    category: 'uses',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: early,
            priority: 50
        }
    ],
    genericConfig: {
        restoreActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RestoreUses.RestoreActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RestoreUses.RestoreActivity.Hint'
        },
        requireEmpty: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RestoreUses.RequireEmpty.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RestoreUses.RequireEmpty.Hint'
        },
        offerRestore: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RestoreUses.OfferRestore.Label',
            hint: 'CHRISPREMADES.Macros.Generic.RestoreUses.OfferRestore.Hint'
        }
    }
};
const configKeys = Object.keys(restoreUses.genericConfig);
