import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && !constants.unarmedAttacks.includes(genericUtils.getIdentifier(i)));
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
async function change({workflow}) {
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
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType',buttons);
    if (!damageType) return;
    let baseFormula = selectedWeapon.system.damage.base.formula;
    let baseType = selectedWeapon.system.damage.base.types.first();
    let newFormula = baseFormula.replaceAll(baseType, damageType);
    let versatile = selectedWeapon.system.damage.versatile.formula;
    let versatileType = selectedWeapon.system.damage.versatile.types.first();
    let demiurgicColossus = itemUtils.getItemByIdentifier(workflow.actor, 'demiurgicColossus');
    let bonusDice = demiurgicColossus ? 2 : 1;
    newFormula += ' + ' + bonusDice + 'd6[' + damageType + ']';
    if (versatile?.length) versatile.replaceAll(versatileType, damageType);
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
                key: 'system.damage.base.custom.enabled',
                mode: 5,
                value: '"true"',
                priority: 20
            },
            {
                key: 'system.damage.base.custom.formula',
                mode: 5,
                value: newFormula,
                priority: 20
            },
            {
                key: 'system.damage.base.types',
                mode: 5,
                value: '["' + damageType + '"]',
                priority: 20
            }
        ]
    };
    if (versatile?.length) {
        enchantData.changes.push({
            key: 'system.damage.versatile.custom.enabled',
            mode: 5,
            value: '"true"',
            priority: 20
        }, {
            key: 'system.damage.versatile.custom.formula',
            mode: 5,
            value: versatile,
            priority: 20
        }, {
            key: 'system.damage.versatile.types',
            mode: 5,
            value: '["' + damageType + '"]',
            priority: 20
        });
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'elementalCleaverChange', {strict: true});
    if (!feature) return;
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        parentEntity: rageEffect, 
        identifier: 'elementalCleaver', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'elementalCleaver', 
            activityIdentifier: 'elementalCleaverChange'
        }]
    });
    if (!effect) return;
    await itemUtils.enchantItem(selectedWeapon, enchantData, {parentEntity: effect});
}
export let elementalCleaver = {
    name: 'Elemental Cleaver',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['elementalCleaver']
            },
            {
                pass: 'rollFinished',
                macro: change,
                priority: 50,
                activities: ['elementalCleaverChange']
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Elemental Cleaver': [
                'Elemental Cleaver: Change Damage Type'
            ]
        }
    }
};