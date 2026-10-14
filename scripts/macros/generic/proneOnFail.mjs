import {actorUtils, automationUtils, documentUtils, Logging, workflowUtils} from '../../proxy.mjs';
async function skipProne({document: activity, workflow}) {
    if (!automationUtils.getGenericConfigValue(activity, 'chris-premades', 'proneOnFail', 'skipProne')) return;
    const proneTargets = Array.from(workflow.targets).filter(token => !token.actor || token.actor.statuses.has('prone') || actorUtils.checkTrait(token.actor, 'ci', 'prone'));
    if (!proneTargets.length) return;
    if (proneTargets.length === workflow.targets.size) {
        Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'All targets are already prone or immune to prone.');
        return true;
    }
    await workflowUtils.removeTargets(workflow, proneTargets);
}
async function macroConditions({workflow}) {
    workflowUtils.addMacroConditions(workflow, 'prone');
}
async function fail({workflow}) {
    await Promise.all(workflow.failedSaves.map(async token => {
        if (!token.actor) return;
        await actorUtils.applyConditions(token.actor, ['prone']);
    }));
}
/**
 * Knocks prone each target that failed the save.
 * Bound on an activity. Fires on `activityPreItemRoll`, `activityPreambleComplete` and `activityRollFinished`.
 *
 * Config:
 * - `skipProne`: skip targets that are already prone or immune to it. Cancels the use when no target is left.
 */
export const proneOnFail = {
    rules: 'all',
    version: '2.1.0',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: skipProne,
            priority: 50
        },
        {
            pass: 'activityPreambleComplete',
            macro: macroConditions,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: fail,
            priority: 50
        }
    ],
    genericConfig: {
        skipProne: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ProneOnFail.SkipProne',
            hint: 'CHRISPREMADES.Macros.Generic.ProneOnFail.SkipProneHint'
        }
    }
};
