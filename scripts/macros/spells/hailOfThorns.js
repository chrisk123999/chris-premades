import {activityUtils, actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                hailOfThorns: {
                    castLevel: workflow.castData?.castLevel ?? 1
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['hailOfThornsBurst']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'hailOfThornsBurst'});
    if (concentrationEffect) genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function late({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.item?.system?.actionType !== 'rwak') return;
    let feature = await activityUtils.getActivityByIdentifier(fromUuidSync(effect.origin), 'hailOfThornsBurst', {strict: true});
    if (!feature) return;
    let castLevel = Math.min(effect.flags['chris-premades'].hailOfThorns.castLevel, 6);
    let targetToken = workflow.targets.first();
    let allTargets = tokenUtils.findNearby(targetToken, 5).concat(targetToken);
    await workflowUtils.syntheticActivityRoll(feature, allTargets, {atLevel: castLevel});
    await genericUtils.remove(effect);
}
export let hailOfThorns = {
    name: 'Hail of Thorns',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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