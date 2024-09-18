/* eslint-disable no-fallthrough */
import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let nameMap = {
        PotionOfHealingNormal: 'Potion of Healing (Normal)', 
        PotionOfClimbing: 'Potion of Climbing', 
        PotionOfHealingGreater: 'Potion of Healing (Greater)', 
        PotionOfFlying: 'Potion of Flying', 
        PotionOfHealingSuperior: 'Potion of Healing (Superior)', 
        PotionOfHealingSupreme: 'Potion of Healing (Supreme)', 
        PotionOfDragonsMajesty: 'Potion of Dragon\'s Majesty.'
    };
    let buttons = [];
    switch (genericUtils.getIdentifier(workflow.item)) {
        case 'dragonVessel3':
            buttons.push(
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfHealingSupreme'), 'PotionOfHealingSupreme'], 
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfDragonsMajesty'), 'PotionOfDragonsMajesty'],
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.Whiskey'), false]
            );
        case 'dragonVessel2':
            buttons.push(
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfHealingSuperior'), 'PotionOfHealingSuperior'], 
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfFlying'), 'PotionOfFlying'],
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.Wine'), false]
            );
        case 'dragonVessel1':
            buttons.push(
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfHealingGreater'), 'PotionOfHealingGreater'], 
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfFireBreath'), 'PotionOfFireBreath'],
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.Mead'), false]
            );
        default:
            buttons.push(
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfHealingNormal'), 'PotionOfHealingNormal'], 
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.PotionOfClimbing'), 'PotionOfClimbing'],
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.Ale'), false],
                [genericUtils.translate('CHRISPREMADES.Macros.DragonVessel.OliveOil'), false]
            );
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.DragonVessel.Select', buttons);
    if (!selection) return;
    let itemData;
    if (selection === 'PotionOfFireBreath') {
        itemData = await compendiumUtils.getItemFromCompendium(constants.packs.items, 'Potion of Fire Breath', {object: true, translate: 'CHRISPREMADES.Macros.DragonVessel.PotionOfFireBreath'});
    } else {
        let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
        if (!itemCompendium) {
            errors.missingPack();
            return;
        }
        itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, nameMap[selection], {object: true, translate: 'CHRISPREMADES.Macros.DragonVessel.' + selection});
    }
    if (!itemData) {
        errors.missingPackItem();
        return;
    }
    itemData.name = workflow.item.name + ': ' + itemData.name;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: {
            seconds: 86400
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    let [item] = await itemUtils.createItems(workflow.actor, [itemData], {favorite: true, parentEntity: effect});
    await effectUtils.addDependent(item, [effect]);
}
export let dragonVessel = {
    name: 'Dragon Vessel',
    version: '0.12.70',
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
let version = '0.12.70';
export let dragonVessel0 = {
    name: 'Dragon Vessel (Slumbering)',
    version
};
export let dragonVessel1 = {
    name: 'Dragon Vessel (Stirring)',
    version
};
export let dragonVessel2 = {
    name: 'Dragon Vessel (Wakened)',
    version
};
export let dragonVessel3 = {
    name: 'Dragon Vessel (Ascendant)',
    version
};