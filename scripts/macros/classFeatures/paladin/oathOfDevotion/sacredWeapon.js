import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    let selectedWeapon;
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.SacredWeapon.NoWeapons', 'warn');
        return;
    }
    if (weapons.length === 1) {
        [selectedWeapon] = weapons;
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.SacredWeapon.SelectWeapon', weapons);
        if (!selectedWeapon) return;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Sacred Weapon: Dismiss', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.SacredWeapon.Dismiss', identifier: 'sacredWeaponDismiss'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 40,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 20,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'zeroHP'
                ]
            }
        }
    };
    let enchantData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + genericUtils.translate('CHRISPREMADES.Macros.SacredWeapon.Sacred') + ')',
                priority: 20
            },
            {
                key: 'system.attack.bonus',
                mode: 2,
                value: '+1',
                priority: 20
            },
            {
                key: 'system.properties',
                mode: 2,
                value: 'mgc',
                priority: 20
            }
        ]
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {vae: [{type: 'use', name: featureData.name, identifier: 'sacredWeaponDismiss'}], identifier: 'sacredWeapon'});
    await itemUtils.enchantItem(selectedWeapon, enchantData, {parentEntity: effect});
    await itemUtils.createItems(workflow.actor, [featureData], {parentEntity: effect});
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'sacredWeapon');
    if (effect) await genericUtils.remove(effect);
}
export let sacredWeapon = {
    name: 'Channel Divinity: Sacred Weapon',
    version: '0.12.24',
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
export let sacredWeaponDismiss = {
    name: 'Sacred Weapon: Dismiss',
    version: sacredWeapon.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50
            }
        ]
    }
};