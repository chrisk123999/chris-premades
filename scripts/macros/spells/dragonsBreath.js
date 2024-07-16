import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.macros.dragonsBreath.select', buttons);
    if (!damageType) damageType = 'fire';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Dragon Breath', {getDescription: true, translate: 'CHRISPREMADES.macros.dragonsBreath.dragonBreath', identifier: 'dragonBreath', object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let diceNumber = workflow.castData.castLevel + 1;
    featureData.system.damage.parts = [
        [
            diceNumber + 'd6[' + damageType + ']',
            damageType
        ]
    ];
    featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
    genericUtils.setProperty(featureData, 'flags.chris-premades.spell.castData', workflow.castData);
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
    let duration = 60 * workflow.item.system.duration.value;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: duration
        }
    };
    for (let target of workflow.targets) {
        let effect = await effectUtils.createEffect(target.actor, effectData, {concentrationItem: workflow.item, interdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'dragonBreath'}], identifier: 'dragonsBreath'});
        await itemUtils.createItems(target.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures'), identifier: 'dragonBreath'});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': duration});
}
export let dragonsBreath = {
    name: 'Dragon\'s Breath',
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