import {actorUtils} from '../../proxy.mjs';
async function late({workflow}) {
    await Promise.all(workflow.hitTargets.map(async token => {
        if (!token.actor) return;
        await actorUtils.applyConditions(token.actor, ['prone']);
    }));
}
/**
 * Knocks prone each target that was hit.
 * Bound on an activity. Fires on `activityRollFinished`.
 */
export const proneOnHit = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: late,
            priority: 50
        }
    ]
};
