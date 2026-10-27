import {automationUtils, documentUtils, workflowUtils} from '../../proxy.mjs';
function getRecipients(document, actor, targetActors) {
    const actors = automationUtils.getGenericConfigValue(document, 'chris-premades', 'heroicInspiration', 'affects') === 'targets' ? targetActors : [actor];
    return new Set(actors.filter(recipient => recipient?.type === 'character' && !recipient.system.attributes.inspiration));
}
async function preTargeting({activity, config}) {
    const targetActors = workflowUtils.getPreTargetingTargets(config).map(token => token.actor);
    if (!getRecipients(activity, activity.actor, targetActors).size) return true;
}
async function rollFinished({document, workflow}) {
    const recipients = getRecipients(document, workflow.actor, Array.from(workflow.targets, token => token.actor));
    await Promise.all(Array.from(recipients, actor => documentUtils.update(actor, {'system.attributes.inspiration': true})));
}
/**
 * Gives Heroic Inspiration to the activity's user or its targets.
 * Bound on an activity. Fires on `activityPreTargeting` and `activityRollFinished`.
 * Creatures that already have Heroic Inspiration or are not characters are skipped, and the use is cancelled when nobody is left.
 *
 * Config:
 * - `affects`: give Heroic Inspiration to the user of the activity or to its targets.
 */
export const heroicInspiration = {
    rules: 'all',
    version: '2.1.4',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preTargeting,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: rollFinished,
            priority: 50
        }
    ],
    genericConfig: {
        affects: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Affects',
            hint: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.AffectsHint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Targets', value: 'targets'}
            ]
        }
    }
};
