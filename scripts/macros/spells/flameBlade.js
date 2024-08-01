import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Flame Blade Scimitar', {getDescription: true, translate: 'CHRISPREMADES.Macros.FlameBlade.Scimitar', identifier: 'flameBladeScimitar', object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let featureData2 = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Evoke Flame Blade', {getDescription: true, translate: 'CHRISPREMADES.Macros.FlameBlade.Evoke', identifier: 'flameBladeEvoke', object: true});
    if (!featureData2) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let damageDice = 3;
    switch (workflow.castData.castLevel) {
        case 4:
        case 5:
            damageDice = 4;
            break;
        case 6:
        case 7:
            damageDice = 5;
            break;
        case 8:
        case 9:
            damageDice = 6;
            break;
    }
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.parts = [
        [
            damageDice + 'd6[' + damageType + ']',
            damageType
        ]
    ];
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 20,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 10,
                priority: 20
            }
        ],
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, vae: [{type: 'use', name: featureData.name, identifier: 'flameBladeScimitar'}, {type: 'use', name: featureData2.name, identifier: 'flameBladeEvoke'}]});
    await itemUtils.createItems(workflow.actor, [featureData, featureData2], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
export let flameBlade = {
    name: 'Flame Blade',
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
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};