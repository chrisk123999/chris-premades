import {itemUtils, Logging, workflowUtils} from '../../../proxy.mjs';
function isValidSource(item) {
    if (item.type === 'spell') return true;
    if (item.type === 'consumable') return item.system.type?.value === 'potion';
    return item.type === 'feat' && item.system.type?.value === 'class';
}
async function healed({document: item, workflow, sourceToken}) {
    if (!sourceToken || workflow.item === item || !workflow.item || !isValidSource(workflow.item)) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'remarkable-recovery');
    if (!activity) return Logging.addMacroWarning('chris-premades', 'remarkable-recovery-regain-hit-points', 'Missing the remarkable-recovery activity.', {notify: 'warn'});
    await workflowUtils.completeActivityUse(activity, [sourceToken]);
}
export const remarkableRecovery = {
    name: 'Remarkable Recovery: Regain Hit Points',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'targetRollFinished',
            macro: healed,
            priority: 250
        }
    ]
};
