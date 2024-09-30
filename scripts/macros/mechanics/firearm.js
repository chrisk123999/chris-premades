import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';
async function misfire({trigger, workflow}) {
    let baseItem = workflow.item.system.type?.baseItem;
    let proficient = workflow.item.system.proficient || workflow.actor.system.traits.weaponProf.value.has(baseItem) || workflow.actor.system.traits.weaponProf.value.has('oth');
    let misfireScore = Number(itemUtils.getConfig(workflow.item, 'misfire')) ?? 1;
    if (!proficient) misfireScore += 1;
    if (workflow.attackRoll.terms[0].total > misfireScore) return;
    await ChatMessage.create({
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        content: workflow.item.name + ' ' + genericUtils.translate('CHRISPREMADES.Firearm.HasMisfired')
    });
    if (workflow.item.id) {
        await itemUtils.setConfig(workflow.item, 'status', 1);
    }
    let damagedEnchant = {
        name: genericUtils.translate('CHRISPREMADES.Firearm.Damaged'),
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + genericUtils.translate('CHRISPREMADES.Firearm.Damaged') + ')',
                priority: 20
            }
        ]
    };
    await itemUtils.enchantItem(workflow.item, damagedEnchant, {identifier: 'damaged'});
    let effectData = {
        img: constants.tempConditionIcon,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        name: genericUtils.translate('CHRISPREMADES.Firearm.Misfire'),
        changes: [
            {
                key: 'flags.midi-qol.fail.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Attack'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function status({trigger, workflow}) {
    let status = Number(itemUtils.getConfig(workflow.item, 'status'));
    switch (status) {
        case 1:
            genericUtils.notify('CHRISPREMADES.Firearm.IsDamaged', 'info');
            return true;
        case 2:
            genericUtils.notify('CHRISPREMADES.Firearm.IsBroken', 'info');
            return true;
    }
    let shotsLeft = workflow.item.system.uses.value;
    let selectedAmmo = workflow.actor.items.get(workflow.item.system.consume?.target);
    if (!shotsLeft || !selectedAmmo?.system.quantity) {
        genericUtils.notify('CHRISPREMADES.Firearm.OutOfAmmo', 'info');
        return true;
    }
    await genericUtils.update(workflow.item, {'system.uses.value': shotsLeft - 1});
}
// async function late({workflow}) {
//     let viciousIntent = itemUtils.getItemByIdentifier(workflow.actor, 'viciousIntent');
//     let hemorrhagingCritical = itemUtils.getItemByIdentifier(workflow.actor,' hemorrhagingCritical');
//     let adeptMarksman = itemUtils.getItemByIdentifier(workflow.actor, 'adeptMarksman');
//     if (workflow.hitTargets.size !== 1) return;
//     let critRoll = 
// }
async function repair({workflow}) {
    let repairFirearms = workflow.actor.items.filter(i => itemUtils.getConfig(i, 'status') == 1);
    if (!repairFirearms.length) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoRepairs', 'info');
        return;
    }
    let weapon;
    if (repairFirearms.length === 1) weapon = repairFirearms[0];
    if (!weapon) weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Firearm.SelectRepair', repairFirearms);
    if (!weapon) return;
    let tinker = workflow.actor.items.find(i => i.system.type?.baseItem === 'tinker');
    if (!tinker) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoTinkers', 'info');
        return;
    }
    let roll = await workflow.actor.rollToolCheck('tinker');
    let misfireDC = 8 + (Number(itemUtils.getConfig(weapon, 'misfire')) ?? 1);
    let effect = Array.from(weapon.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'damaged');
    if (effect) await genericUtils.remove(effect);
    let content;
    if (roll.total >= misfireDC) {
        await itemUtils.setConfig(weapon, 'status', 0);
        content = genericUtils.format('CHRISPREMADES.Firearm.RepairSuccess', {weaponName: weapon.name});
    } else {
        let brokenEffectData = {
            name: genericUtils.translate('CHRISPREMADES.Firearm.Broken'),
            img: weapon.img,
            origin: workflow.actor.uuid,
            changes: [
                {
                    key: 'name',
                    mode: 5,
                    value: '{} (' + genericUtils.translate('CHRISPREMADES.Firearm.Broken') + ')',
                    priority: 20
                }
            ]
        };
        content = genericUtils.format('CHRISPREMADES.Firearm.RepairFailure', {weaponName: weapon.name});
        await itemUtils.enchantItem(weapon, brokenEffectData, {identifier: 'broken'});
        await itemUtils.setConfig(weapon, 'status', 2);
    }
    await ChatMessage.create({
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name,
        content
    });
}
async function reload({workflow}) {
    let ammunition = workflow.actor.items.filter(i => i.system.type?.value === 'ammo' && i.system.type.subtype === 'firearmAmmo' && i.system.quantity);
    if (!ammunition.length) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoAmmo', 'info');
        return;
    }
    let weapons = workflow.actor.items.filter(i => i.system.type?.value === 'firearm' && (i.system.uses.value < i.system.uses.max || !i.system.consume?.target?.length || !workflow.actor.items.get(i.system.consume.target)?.system.quantity));
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoReloads', 'info');
        return;
    }
    let weapon;
    if (weapons.length === 1) weapon = weapons[0];
    if (!weapon) weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Firearm.SelectReload', weapons);
    if (!weapon) return;
    let ammo;
    if (ammunition.length === 1) ammo = ammunition[0];
    if (!ammo) ammo = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Firearm.SelectAmmo', ammunition);
    if (!ammo) return;
    await genericUtils.update(weapon, {
        'system.uses.value': weapon.system.uses.max,
        'system.consume.target': ammo.id
    });
}
export let firearm = {
    name: 'Firearm',
    version: '0.12.86',
    midi: {
        item: [
            {
                pass: 'postAttackRoll',
                macro: misfire,
                priority: 10
            },
            {
                pass: 'preItemRoll',
                macro: status,
                priority: 10
            }
        ]
    },
    config: [
        {
            value: 'status',
            label: 'CHRISPREMADES.Firearm.Status',
            type: 'select',
            options: [
                {
                    value: 0,
                    label: 'CHRISPREMADES.Firearm.Undamaged'
                },
                {
                    value: 1,
                    label: 'CHRISPREMADES.Firearm.Damaged'
                },
                {
                    value: 2,
                    label: 'CHRISPREMADES.Firearm.Broken'
                },
            ],
            default: 0,
            category: 'mechanics'
        },
        {
            value: 'misfire',
            label: 'CHRISPREMADES.Firearm.MisfireScore',
            type: 'text',
            default: '1',
            category: 'mechanics'
        }
    ]
};
export let firearmRepair = {
    name: 'Repair Firearm',
    version: '0.12.86',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: repair,
                priority: 50
            }
        ]
    }
};
export let firearmReload = {
    name: 'Reload Firearm',
    version: '0.12.86',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: reload,
                priority: 50
            }
        ]
    }
};