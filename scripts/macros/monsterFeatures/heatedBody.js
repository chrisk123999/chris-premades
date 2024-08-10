import {actorUtils, constants, tokenUtils, workflowUtils} from '../../utils.js';

async function hit({trigger: {entity: feature}, workflow}) {
    if (!workflow.hitTargets.size) return;
    let targetToken = actorUtils.getFirstToken(feature.parent);
    if (!targetToken) return;
    let distance = tokenUtils.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    if (!constants.meleeAttacks.includes(workflow.item.system.actionType)) return;
    if (!feature) return;
    await workflowUtils.syntheticItemRoll(feature, [workflow.token]);
}
export let heatedBody = {
    name: 'Heated Body',
    version: '0.12.11',
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