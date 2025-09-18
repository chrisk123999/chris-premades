import {actorUtils, constants, tokenUtils, workflowUtils} from '../../../utils.js';

async function hit({trigger: {entity: feature}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let targetToken = actorUtils.getFirstToken(feature.parent);
    if (!targetToken) return;
    let distance = tokenUtils.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    if (!constants.meleeAttacks.includes(workflowUtils.getActionType(workflow))) return;
    if (!feature) return;
    await workflowUtils.syntheticItemRoll(feature, [workflow.token]);
}
export let heatedBody = {
    name: 'Heated Body',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 50
            }
        ]
    }
};