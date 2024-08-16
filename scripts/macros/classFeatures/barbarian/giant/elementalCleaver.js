import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && itemUtils.getIdentifer(i) !== 'unarmedStrike');
    if (!weapons.length) return;
    let selectedWeapon;
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ElementalCleaver.SelectWeapon', weapons);
    }
    if (!selectedWeapon) return;
    await infuseWeapon(workflow, selectedWeapon);
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'elementalCleaver');
    if (!effect) return;
    let weaponId = effect.flags['chris-premades']?.elementalCleaver?.weaponId;
    let selectedWeapon = workflow.actor.items.get(weaponId);
    if (!selectedWeapon) return;
    await genericUtils.remove(effect);
    await infuseWeapon(workflow, selectedWeapon);
}
async function infuseWeapon(workflow, selectedWeapon) {
    let rageEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!rageEffect) return;
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageThunder', 'thunder', {image: 'icons/magic/sonic/explosion-shock-wave-teal.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.ElementalWeapon.SelectDamageType',buttons);
    if (!damageType) return;
    let parts = genericUtils.deepClone(selectedWeapon.system.damage.parts);
    for (let currParts of parts) {
        currParts[0] = currParts[0].replaceAll(currParts[1], damageType);
        currParts[1] = damageType;
    }
    let versatile = genericUtils.duplicate(selectedWeapon.system.damage.versatile) ?? '';
    let demiurgicColossus = itemUtils.getItemByIdentifier(workflow.actor, 'demiurgicColossus');
    let bonusDice = demiurgicColossus ? 2 : 1;
    parts.push([bonusDice + 'd6[' + damageType + ']', damageType]);
    if (selectedWeapon.system.damage.parts.length) versatile.replaceAll(selectedWeapon.system.damage.parts[0][1], damageType);
    if (versatile?.length) versatile += ' + ' + bonusDice + 'd6[' + damageType + ']';
    let enchantData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.ElementalCleaver.ElementalCleaver'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: rageEffect.duration.remaining
        },
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + genericUtils.translate('CHRISPREMADES.Macros.ElementalCleaver.ElementalCleaver') + ': ' + genericUtils.translate(buttons.find(i => i[1] === damageType)[0]) + ')',
                priority: 20
            },
            {
                key: 'system.damage.parts',
                mode: 5,
                value: JSON.stringify(parts),
                priority: 20
            }
        ]
    };
    if (versatile?.length) {
        enchantData.changes.push({
            key: 'system.damage.versatile',
            mode: 5,
            value: versatile,
            priority: 20
        });
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Elemental Cleaver: Change Damage Type', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.ElementalCleaver.Change', identifier: 'elementalCleaverChange'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    effectUtils.addMacro(featureData, 'midi.item', ['elementalCleaverChange']);
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.ElementalCleaver.ElementalCleaver'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: rageEffect.duration.remaining
        },
        flags: {
            'chris-premades': {
                elementalCleaver: {
                    weaponId: selectedWeapon.id
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: rageEffect, identifier: 'elementalCleaver', vae: [{type: 'use', name: featureData.name, identifier: 'elementalCleaverChange'}]});
    if (!effect) return;
    await itemUtils.enchantItem(selectedWeapon, enchantData, {parentEntity: effect});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.Rage'), parentEntity: effect});
}
export let elementalCleaver = {
    name: 'Elemental Cleaver',
    version: '0.12.20',
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
export let elementalCleaverChange = {
    name: 'Elemental Cleaver: Change Damage Type',
    version: elementalCleaver.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};