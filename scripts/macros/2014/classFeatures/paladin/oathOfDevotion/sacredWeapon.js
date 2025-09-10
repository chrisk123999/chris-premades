import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../../utils.js';

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
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
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
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + genericUtils.translate('CHRISPREMADES.Macros.SacredWeapon.Sacred') + ')',
                priority: 20
            },
            {
                key: 'activities[attack].attack.bonus',
                mode: 2,
                value: '+' + Math.max(workflow.actor.system.abilities.cha.mod, 1),
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'sacredWeapon'});
    await itemUtils.enchantItem(selectedWeapon, enchantData, {parentEntity: effect});
}
export let sacredWeapon = {
    name: 'Channel Divinity: Sacred Weapon',
    version: '1.1.0',
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