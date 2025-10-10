import {activityUtils, dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function reactionAttack({trigger, workflow}) {
    workflow.advantage = true;
}
async function battleCry({trigger, workflow}) {
    if (!workflow.token) return;
    workflow.targets.add(workflow.token);
    workflowUtils.updateTargets(workflow, Array.from(workflow.targets));
}
async function kill({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let ditem = workflow.damageList[0];
    if (ditem.newHP || !ditem.oldHP) return;
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'heal', {strict: true});
    if (!activity) return;
    if (!activityUtils.canUse(activity)) return;
    let selection = await dialogUtils.confirmUseItem(activity);
    if (!selection) return;
    let activityData = genericUtils.duplicate(activity.toObject());
    activityData.healing.bonus = Math.floor(ditem.totalDamage);
    await workflowUtils.syntheticActivityDataRoll(activityData, workflow.item, workflow.actor, [workflow.token], {consumeResources: true, consumeUsage: true});
}
export let ruinsWakeD = {
    name: 'Ruin\'s Wake (Dormant)',
    version: '1.3.94',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: reactionAttack,
                priority: 50,
                activities: ['reactionAttack']
            }
        ]
    }
};
export let ruinsWakeA = {
    name: 'Ruin\'s Wake (Awakened)',
    version: ruinsWakeD.version,
    rules: ruinsWakeD.rules,
    midi: ruinsWakeD.midi
};
export let ruinsWakeE ={
    name: 'Ruin\'s Wake (Exalted)',
    version: ruinsWakeD.version,
    rules: ruinsWakeD.rules,
    midi: {
        item: [
            ...ruinsWakeD.midi.item,
            {
                pass: 'preambleComplete',
                macro: battleCry,
                priority: 50,
                activities: ['battleCry']
            },
            {
                pass: 'rollFinished',
                macro: kill,
                priority: 50,
                activities: ['attack', 'reactionAttack']
            }
        ]
    }
};