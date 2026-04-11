import {workflowUtils} from '../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || workflow.hitTargets.size) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.token]);
}
export let studiedAttacks = {
    name: 'Studied Attacks',
    version: '1.5.18',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 200
            }
        ]
    }
};