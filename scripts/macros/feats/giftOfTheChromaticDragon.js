import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';

async function useInfusion({workflow}) {
    let targetToken = workflow.targets.first() ?? workflow.token;
    let weapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.HexWarrior.NoWeapons', 'info');
        return;
    }
    let selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.SacredWeapon.SelectWeapon', weapons);
    if (!selectedWeapon) return;
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
    if (!damageType) return;
    let enchantData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + workflow.item.name + ')',
                priority: 20
            },
            {
                key: 'system.damage.parts',
                mode: 2,
                value: JSON.stringify([['1d4[' + damageType + ']', damageType]]),
                priority: 20
            }
        ]
    };
    await itemUtils.enchantItem(selectedWeapon, enchantData, {});
}
async function useResistance({workflow}) {
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
    if (!damageType) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: damageType,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['1Reaction']
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let chromaticInfusion = {
    name: 'Gift of the Chromatic Dragon: Chromatic Infusion',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useInfusion,
                priority: 50
            }
        ]
    }
};
export let reactiveResistance = {
    name: 'Gift of the Chromatic Dragon: Reactive Resistance',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useResistance,
                priority: 50
            }
        ]
    }
};