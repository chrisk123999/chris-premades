import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Shadow Blade Sword', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ShadowBlade.Sword', identifier: 'shadowBladeSword'});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let diceNum = 2;
    switch (workflow.castData.castLevel) {
        case 3:
        case 4:
            diceNum = 3;
            break;
        case 5:
        case 6:
            diceNum = 4;
            break;
        case 7:
        case 8:
        case 9:
            diceNum = 5;
    }
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.base.number = diceNum;
    featureData.system.damage.base.types = [damageType];
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, vae: [{type: 'use', name: featureData.name, identifier: 'shadowBladeSword'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
export let shadowBlade = {
    name: 'Shadow Blade',
    version: '1.1.0',
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
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};