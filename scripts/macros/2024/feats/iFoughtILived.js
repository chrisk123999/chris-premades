import {activityUtils, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function turnStart({trigger: {entity: item}}) {
    let frightened = effectUtils.getEffectByIdentifier(item.actor, 'frightened');
    if (!frightened) return;
    let acitivity = activityUtils.getActivityByIdentifier(item, 'frightened', {strict: true});
    if (!acitivity) return;
    await workflowUtils.syntheticActivityRoll(acitivity, []);
}
async function use({trigger, workflow}) {
    let frightened = effectUtils.getEffectByStatusID(workflow.actor, 'frightened');
    if (!frightened || workflow.utilityRolls[0].total < 10) return;
    await genericUtils.remove(frightened);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (Math.floor(workflow.actor.system.attributes.hp.pct) > 50) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'defiantStrike', {strict: true});
    if (!activity) return;
    if (!activityUtils.canUse(activity)) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    await Promise.all(workflow.damageRolls.map(async (damageRoll, i, arr) => {
        arr[i] = await damageRoll.reroll({maximize: true});
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token], {consumeResources: true, consumeUsage: true});
}
export let iFoughtILived = {
    name: 'I Fought, I Lived',
    version: '1.4.5',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['frightened']
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 900
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};