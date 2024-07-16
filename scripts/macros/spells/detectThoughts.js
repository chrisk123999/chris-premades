import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Detect Thoughts: Probe Deeper', {getDescription: true, translate: 'CHRISPREMADES.macros.detectThoughts.probeDeeper', identifier: 'probeDeeper', object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
    featureData.origin = workflow.item.uuid;
    let duration = 60 * workflow.item.system.duration.value;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: duration
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'detectThoughts', vae: [{type: 'use', name: featureData.name, identifier: 'probeDeeper'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), identifier: 'probeDeeper'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': duration});
}
async function probeDeeper({workflow}) {
    if (workflow.failedSaves.size) return;
    let effect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item.origin);
    if (effect) await genericUtils.remove(effect);
}
export let detectThoughts = {
    name: 'Detect Thoughts',
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
export let detectThoughtsProbeDeeper = {
    name: 'Detect Thoughts: Probe Deeper',
    version: detectThoughts.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: probeDeeper,
                priority: 50
            }
        ]
    }
};