import {actorUtils, automationUtils, constants} from '../../proxy.mjs';
async function late({document: activity, workflow}) {
    const maxSize = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'proneOnHit', 'maxSize');
    const limit = maxSize ? CONFIG.DND5E.actorSizes[maxSize]?.numerical : undefined;
    await Promise.all(workflow.hitTargets.map(async token => {
        if (!token.actor) return;
        if (limit !== undefined && actorUtils.getSize(token.actor) > limit) return;
        await actorUtils.applyConditions(token.actor, ['prone']);
    }));
}
/**
 * Knocks prone each target that was hit.
 * Bound on an activity. Fires on `activityRollFinished`.
 *
 * Config:
 * - `maxSize`: targets larger than this size are not knocked prone.
 */
export const proneOnHit = {
    rules: 'all',
    version: '2.1.4',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: late,
            priority: 50
        }
    ],
    genericConfig: {
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.ProneOnHit.MaxSizeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        }
    }
};
