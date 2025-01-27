import {activityUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function apply({trigger: {entity: item, token}, workflow, ditem}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'rage');
    if (!effect) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'save', {strict: true});
    if (!activity) return;
    let activityWorkflow = await workflowUtils.syntheticActivityRoll(activity, [token]);
    await genericUtils.update(item, {['system.activities.' + activity.id + '.save.dc.formula']: Number(activity.save.dc.formula) + 5});
    if (activityWorkflow.failedSaves.size) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classItem = token.actor.classes[classIdentifier];
    if (!classItem) return;
    let newHealth = classItem.system.levels * 2;
    ditem.totalDamage = ditem.oldHP - newHealth;
    ditem.newHP = newHealth;
    ditem.newTempHP = 0;
    ditem.hpDamage = ditem.totalDamage;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
}
async function rest({trigger: {entity: item}}) {
    let activity = activityUtils.getActivityByIdentifier(item, 'save', {strict: true});
    if (!activity) return;
    await genericUtils.update(item, {['system.activities.' + activity.id + '.save.dc.formula']: '10'});
}
export let relentlessRage = {
    name: 'Relentless Rage',
    version: '1.1.22',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: apply,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        }
    ]
};