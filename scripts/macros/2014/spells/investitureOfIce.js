import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
import {start as startAnim, end as endAnim} from './fireShield.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'investitureOfIceCone', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: 'fire',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: 'cold',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                fireShield: {
                    selection: 'cold',
                    playAnimation
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['investitureOfIceIcy']);
    // TODO: Need to disable autoanims here? If so should we do for others?
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'investitureOfIce', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'investitureOfIce', 
            activityIdentifier: 'investitureOfIceCone'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['investitureOfIceCone'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
    await startAnim({
        trigger: {
            entity: effect
        }
    });
}
async function end({trigger}) {
    await endAnim({trigger});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let investitureOfIce = {
    name: 'Investiture of Ice',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['investitureOfIce']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['investitureOfIceCone']
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '4d6',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'cold',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let investitureOfIceIcy = {
    name: 'Investiture of Ice: Icy',
    version: investitureOfIce.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};