import {workflowUtils} from '../../../../proxy.mjs';
async function missed({document: activity, workflow}) {
    if (!workflow.targets.count || workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'attack')) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.documents[0]]);
}
export const studiedAttacks = {
    name: 'Studied Attacks',
    version: '2.0.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorCleanup',
            macro: missed,
            priority: 300
        }
    ]
};
