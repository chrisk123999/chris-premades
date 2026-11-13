import {workflowUtils} from '../../../../../proxy.mjs';
async function heal({document: activity, workflow}) {
    if (workflow.targets.count === 1 && workflow.targets.documents[0].uuid === workflow.tokenDocument.uuid) return;
    if (!workflow.targets.count || !workflow.damageRolls?.length || workflow.item.type !== 'spell') return;
    if ((workflow.castData?.castLevel ?? 0) < 1 || workflowUtils.isSustainedRoll(workflow)) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    if (!workflow.actor.system.attributes.hp.damage) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.tokenDocument], {config: {scaling: workflow.castData.castLevel - 1}});
}
export const blessedHealer = {
    name: 'Blessed Healer',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: heal,
            priority: 250
        }
    ]
};
