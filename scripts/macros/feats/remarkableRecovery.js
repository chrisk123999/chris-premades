import {itemUtils, workflowUtils} from '../../utils.js';
async function heal({trigger, workflow}) {
    if (!(workflow.item.type === 'spell' || itemUtils.isSpellFeature(workflow.item) || workflow.item.system.type.value === 'potion' || workflow.item.system.type.value === 'class')) return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.has('healing')) return;
    for (let target of workflow.targets) {
        let remarkableRecovery = itemUtils.getItemByIdentifier(target.actor, 'remarkableRecovery');
        if (remarkableRecovery) await workflowUtils.syntheticItemRoll(remarkableRecovery, [target]);
    }
}
export let remarkableRecovery = {
    name: 'Remarkable Recovery: Regain Hit Points',
    version: '1.0.10',
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