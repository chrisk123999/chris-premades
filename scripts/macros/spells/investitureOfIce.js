import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';
import {start as startAnim, end as endAnim, fireShield} from './fireShield.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Investiture of Ice: Cone', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.investitureOfIce.cone', identifier: 'investitureOfIceCone', castDataWorkflow: workflow});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.parts = [
        [
            formula + '[' + damageType + ']',
            damageType
        ]
    ];
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'fire',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 0,
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'investitureOfIce', vae: [{type: 'use', name: featureData.name, identifier: 'investitureOfIceCone'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), identifier: 'investitureOfIceCone'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
    await startAnim({
        trigger: {
            entity: effect
        }
    });
}
async function end({trigger}) {
    await endAnim({trigger});
}
export let investitureOfIce = {
    name: 'Investiture of Ice',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '4d6',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.config.damageType',
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