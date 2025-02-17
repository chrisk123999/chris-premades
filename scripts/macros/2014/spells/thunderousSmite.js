import {activityUtils, actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
import {proneOnFail} from '../generic/proneOnFail.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['thunderousSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'thunderousSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.activity.actionType !== 'mwak') return;
    let originItem = await effectUtils.getOriginItem(effect);
    let damageType = itemUtils.getConfig(originItem, 'damageType');
    let formula = '2d6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let feature = activityUtils.getActivityByIdentifier(originItem, 'thunderousSmitePush', {strict: true});
    if (!feature) return;
    let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, [workflow.hitTargets.first()]);
    if (featureWorkflow.failedSaves.size) {
        let targetToken = workflow.targets.first();
        await tokenUtils.pushToken(workflow.token, targetToken, 10);
    }
    await genericUtils.remove(effect);
}
export let thunderousSmite = {
    name: 'Thunderous Smite',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['thunderousSmite']
            },
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['thunderousSmitePush']
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'thunder',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let thunderousSmiteDamage = {
    name: 'Thunderous Smite: Damage',
    version: thunderousSmite.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};