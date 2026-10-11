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
            Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'CHRISPREMADES.Macros.Generic.RestoreUses.NoneSpent', {notify: 'info', format: {item: document.name}});
            return true;
        }
        if (settings.requireEmpty && uses.value) {
            Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'CHRISPREMADES.Macros.Generic.RestoreUses.NotEmpty', {notify: 'info', format: {item: document.name}});
            return true;
        }
        return;
    }
    if (!settings.offerRestore || uses.value || config.consume === false || config.consume?.resources === false) return;
    if (!activity.consumption.targets.some(target => isOwnUses(document, target) && Number(target.value) > 0)) return;
    const cost = restoreActivity.consumption.targets.find(target => !isOwnUses(document, target));
    const pool = cost?.type === 'itemUses' ? document.actor.items.get(cost.target) : undefined;
    if (pool && pool.system.uses.value < Number(cost.value)) return;
    const selection = await dialogUtils.confirmUseExtraCost(document, cost?.value ?? 0, pool?.name ?? restoreActivity.name);
    if (!selection) return true;
    await workflowUtils.completeActivityUse(restoreActivity);
    const freshActivity = document.actor.items.get(document.id)?.system.activities.get(activity.id);
    if (!freshActivity) return true;
    const targets = Array.from(config.midiOptions?.targetsToUse ?? [], token => token.document ?? token);
    await workflowUtils.completeActivityUse(freshActivity, targets, {consumeUsage: config.consumeUsage !== false, consumeResources: config.consume?.resources !== false});
    return true;
}
/**
 * Controls when this item's restore activity can be used, and offers it when the item runs out of uses.
 * Bound on an item. Fires on `itemPreTargeting`.
 * The restore activity is blocked while no uses are spent.
 * When the offered restore runs, the original activity is used again afterwards.
 *
 * Config:
 * - `restoreActivity`: activity that restores this item's uses. Blank uses the first activity that restores one.
 * - `requireEmpty`: block the restore activity while uses remain.
 * - `offerRestore`: when another activity needs a use and none remain, offer to run the restore activity first.
 */
export const restoreUses = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
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
            label: 'CHRISPREMADES.Macros.Generic.RestoreUses.RestoreActivity',
            hint: 'CHRISPREMADES.Macros.Generic.RestoreUses.RestoreActivityHint'
        },
        requireEmpty: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RestoreUses.RequireEmpty',
            hint: 'CHRISPREMADES.Macros.Generic.RestoreUses.RequireEmptyHint'
        },
        offerRestore: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.RestoreUses.OfferRestore',
            hint: 'CHRISPREMADES.Macros.Generic.RestoreUses.OfferRestoreHint'
        }
    }
};
const configKeys = Object.keys(restoreUses.genericConfig);
