import {workflowUtils} from '../../../../proxy.mjs';
async function missed({document: activity, workflow}) {
    if (!workflow.targets.size || workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.first().document]);
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
