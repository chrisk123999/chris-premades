import {activityUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                blindingSmite: {
                    used: false,
                    damageType: itemUtils.getConfig(workflow.item, 'damageType')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['blindingSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'blindingSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflowUtils.getActionType(workflow) !== 'mwak') return;
    if (effect.flags['chris-premades'].blindingSmite.used) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'blindingSmite.used', true);
    let damageType = effect.flags['chris-premades'].blindingSmite.damageType;
    let formula = '3d8';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let feature = activityUtils.getActivityByIdentifier(await effectUtils.getOriginItem(effect), 'blindingSmiteBlind', {strict: true});
    if (!feature) return;
    let featureWorkflow = await workflowUtils.syntheticActivityRoll(feature, [workflow.hitTargets.first()]);
    let targetEffect = featureWorkflow.failedSaves.first()?.actor?.appliedEffects?.find(currEffect => currEffect.origin === featureWorkflow._id);
    if (!targetEffect) {
        await genericUtils.remove(effect);
        return;
    }
    let updates = {
        origin: effect.origin
    };
    await genericUtils.update(targetEffect, updates);
    await effectUtils.addDependent(effect, [targetEffect]);
    await effectUtils.addDependent(targetEffect, [effect]);
}
export let blindingSmite = {
    name: 'Blinding Smite',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['blindingSmite']
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let blindingSmiteDamage = {
    name: 'Blinding Smite: Damage',
    version: blindingSmite.version,
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