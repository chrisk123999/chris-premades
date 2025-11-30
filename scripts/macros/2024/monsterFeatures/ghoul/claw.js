import {activityUtils, actorUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let validTargets = workflow.hitTargets.filter(token => {
        let type = actorUtils.typeOrRace(token.actor);
        if (type === 'undead') return false;
        let species = token.actor.system.details?.type?.subtype ?? actorUtils.raceOrType(token.actor);
        if (!/\belf\b/i.test(species)) return false;
        return true;
    });
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'save', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, Array.from(validTargets));
}
export let ghoulClaw = {
    name: 'Claw',
    version: '1.3.149',
    rules: 'modern',
    monsters: [
        'Ghoul'
    ],
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['attack']
            }
        ]
    }
};