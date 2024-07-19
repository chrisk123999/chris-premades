import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Investiture of Stone: Earthquake', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.investitureOfStone.earthquake', identifier: 'investitureOfStoneEarthquake', castDataWorkflow: workflow});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.traits.dr.custom',
                mode: 0,
                value: 'Non-Magical Physical',
                priority: 20
            }
        ]
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'investitureOfStone', vae: [{type: 'use', name: featureData.name, identifier: 'investitureOfStoneEarthquake'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), identifier: 'investitureOfStoneEarthquake'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
export let investitureOfStone = {
    name: 'Investiture of Stone',
    version: '0.12.0',
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