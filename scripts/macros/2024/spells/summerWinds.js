import {activityUtils, actorUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    let undead = workflow.targets.filter(token => actorUtils.raceOrType(token.actor) === 'undead' && token.document.disposition != workflow.token.document.disposition);
    console.log(undead);
    let allies = workflow.targets.filter(token => token.document.disposition === workflow.token.document.disposition);
    await workflowUtils.updateTargets(workflow, allies);
    if (!undead.size) return;
    genericUtils.setProperty(workflow, 'chris-premades.summerWinds', Array.from(undead));
}
async function late({trigger, workflow}) {
    let undead = workflow['chris-premades']?.summerWinds;
    if (!undead) return;
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'undead', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, undead, {atLevel: workflowUtils.getCastLevel(workflow)});
}
export let summerWinds = {
    name: 'Summer Winds',
    version: '1.5.18',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50,
                activities: ['heal']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['heal']
            }
        ]
    }
};