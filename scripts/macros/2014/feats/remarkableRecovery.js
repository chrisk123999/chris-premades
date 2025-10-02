import {itemUtils, workflowUtils} from '../../../utils.js';
async function heal({trigger: {entity: item}, workflow}) {
    if (!(workflow.item.type === 'spell' || itemUtils.isSpellFeature(workflow.item) || ['potion', 'class'].includes(workflow.item.system.type?.value))) return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.has('healing')) return;
    await workflowUtils.completeItemUse(item);
}
export let remarkableRecovery = {
    name: 'Remarkable Recovery: Regain Hit Points',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetRollFinished',
                macro: heal,
                priority: 150
            }
        ]
    }
};