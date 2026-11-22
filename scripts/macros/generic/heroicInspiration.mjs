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
    const recipients = getRecipients(document, workflow.actor, workflow.targets.documents.map(token => token.actor));
    await Promise.all(Array.from(recipients, actor => documentUtils.update(actor, {'system.attributes.inspiration': true})));
}
/**
 * Gives Heroic Inspiration to the activity's user or its targets. Creatures that already have Heroic Inspiration or are
 * not player characters are skipped. The use is canceled before targeting when nobody is left to receive it.
 */
export const heroicInspiration = {
    rules: 'all',
    version: '2.1.4',
    category: 'rolls',
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
            label: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Affects.Label',
            hint: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Affects.Hint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Generic.HeroicInspiration.Targets', value: 'targets'}
            ]
        }
    }
};
