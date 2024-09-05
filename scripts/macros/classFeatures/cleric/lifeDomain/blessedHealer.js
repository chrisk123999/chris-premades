import {genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function heal({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellfeature')) return;
    let castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!castData?.castLevel) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    if (workflow.targets.size === 1 && workflow.targets.first().document.uuid === workflow.token.document.uuid) return;
    let itemData = genericUtils.duplicate(trigger.entity.toObject());
    delete itemData._id;
    itemData.system.damage.parts[0][0] = 2 + castData.castLevel;
    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [workflow.token]);
}
export let blessedHealer = {
    name: 'Blessed Healer',
    version: '0.12.53',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: heal,
                priority: 250
            }
        ]
    }
};