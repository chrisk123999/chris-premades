import {activityUtils, actorUtils, dialogUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.actor.system.attributes.inspiration) return;
    let killed = workflow.damageList.find(i => {
        if (i.newHP != 0) return;
        if (i.oldHP == 0) return;
        let actor = fromUuidSync(i.actorUuid);
        if (!actor) return;
        if (!actor.system.details.cr) return;
        return true;
    });
    if (!killed) return;
    await actorUtils.giveHeroicInspiration(workflow.actor);
    let activity = activityUtils.getActivityByIdentifier(item, 'betBig', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token]);
}
async function saved({trigger: {entity: item}, workflow}) {
    if (workflow.actor.system.attributes.inspiration) return;
    if (!activityUtils.hasSave(workflow.activity)) return;
    if (!workflow.failedSaves.size) return;
    let validTargets = workflow.failedSaves.filter(token => token.actor.system.details.cr);
    if (!validTargets.size) return;
    await actorUtils.giveHeroicInspiration(workflow.actor);
    let activity = activityUtils.getActivityByIdentifier(item, 'betBig', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token]);
}
async function skillOrAbility({trigger: {actor, entity: item, token}}) {
    if (actor.system.attributes.inspiration) return;
    let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.FateGambler.SkillOrAbility', {buttons: 'yesNo'});
    if (!selection) return;
    await actorUtils.giveHeroicInspiration(actor);
    let activity = activityUtils.getActivityByIdentifier(item, 'betBig', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [token]);
}
async function heal({trigger, workflow}) {
    await genericUtils.update(workflow.actor, {'system.attributes.inspiration': false});
}
export let fateGambler = {
    name: 'Fate Gambler',
    version: '1.4.14',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 250
            },
            {
                pass: 'rollFinished',
                macro: saved,
                priority: 251
            }
        ],
        item: [
            {
                pass: 'damageRollComplete',
                macro: heal,
                priority: 50,
                activities: ['heal']
            }
        ]
    },
    skill: [
        {
            pass: 'post',
            macro: skillOrAbility,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'post',
            macro: skillOrAbility,
            priority: 50
        }
    ]
};