import {activityUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                hailOfThorns: {
                    castLevel: workflowUtils.getCastLevel(workflow)
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['hailOfThornsBurst']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, identifier: 'hailOfThornsBurst'});
}
async function late({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflowUtils.isAttackType(workflow, 'rangedAttacks')) return;
    let activity = await activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'hailOfThornsBurst', {strict: true});
    if (!activity) return;
    let castLevel = Math.min(effect.flags['chris-premades'].hailOfThorns.castLevel, 6);
    let targetToken = workflow.targets.first();
    let allTargets = tokenUtils.findNearby(targetToken, 5).concat(targetToken);
    await workflowUtils.syntheticActivityRoll(activity, allTargets, {atLevel: castLevel});
    await genericUtils.remove(effect);
}
export let hailOfThorns = {
    name: 'Hail of Thorns',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['hailOfThorns']
            }
        ]
    }
};
export let hailOfThornsBurst = {
    name: 'Hail of Thorns: Burst',
    version: hailOfThorns.version,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};