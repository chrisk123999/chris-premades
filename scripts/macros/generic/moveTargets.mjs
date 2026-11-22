import {automationUtils, queryUtils, tokenUtils} from '../../proxy.mjs';
export async function moveWithin(token, fraction = 0.5) {
    const range = Math.floor((token.actor?.system.attributes.movement.walk ?? 0) * fraction);
    if (range) await tokenUtils.displaceToken(token, {sourceToken: token, range, userId: queryUtils.firstOwner(token.actor, true)});
}
async function use({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'moveTargets', configKeys);
    for (const token of workflow.targets.documents) await moveWithin(token, Number(config.fraction) || 0.5);
}
/**
 * Lets each target of the activity move once the roll finishes, without provoking opportunity attacks. The target's
 * owner picks the destination with a crosshair. Targets with no walking speed do not move.
 */
export const moveTargets = {
    rules: 'all',
    version: '2.1.10',
    category: 'mechanics',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        fraction: {
            default: 0.5,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MoveTargets.Fraction.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MoveTargets.Fraction.Hint'
        }
    }
};
const configKeys = Object.keys(moveTargets.genericConfig);
