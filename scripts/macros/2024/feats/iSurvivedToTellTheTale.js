import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let grappled = effectUtils.getEffectByStatusID(workflow.actor, 'grappled');
    if (!grappled || workflow.utilityRolls[0].total < 10) return;
    await genericUtils.remove(grappled);
}
async function damage({trigger: {token, entity: item}, ditem, workflow}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'survive', {strict: true});
    if (!activity) return;
    if (!activityUtils.canUse(activity)) return;
    let selection = await dialogUtils.confirmUseItem(item, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    if (actorUtils.checkTrait(token.actor, 'ci', 'healing')) return;
    let level = item.actor.system.details.level;
    if (actorUtils.checkTrait(token.actor, 'dr', 'healing')) level = Math.floor(level / 2);
    ditem.totalDamage = ditem.oldHP - level;
    ditem.newHP = level;
    ditem.newTempHP = 0;
    ditem.hpDamage = ditem.totalDamage;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
    await workflowUtils.syntheticActivityRoll(activity, [token], {consumeResources: true, consumeUsage: true});
    if (ditem.oldHP < ditem.newHP) await genericUtils.update(token.actor, {'system.attributes.hp.value': level}); // Midi doesn't like healing here. TODO: Figure out a better way to do this.
}
export let iSurvivedToTellTheTale = {
    name: 'I Survived to Tell the Tale',
    version: '1.4.5',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['grappled']
            }
        ],
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damage,
                priority: 250
            }
        ]
    }
};