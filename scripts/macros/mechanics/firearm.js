import {activityUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function misfire({trigger, workflow}) {
    let baseItem = workflow.item.system.type?.baseItem;
    let proficient = workflow.item.system.proficient || workflow.actor.system.traits.weaponProf.value.has(baseItem) || workflow.actor.system.traits.weaponProf.value.has('oth');
    let misfireScore = Number(itemUtils.getConfig(workflow.item, 'misfire')) ?? 1;
    if (!proficient) misfireScore += 1;
    if (workflow.attackRoll.terms[0].total > misfireScore) return;
    let trickShotEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'trickShot');
    if (trickShotEffect) await genericUtils.remove(trickShotEffect);
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
            workflow.aborted = true;
            return true;
        case 2:
            genericUtils.notify('CHRISPREMADES.Firearm.IsBroken', 'info');
            workflow.aborted = true;
            return true;
    }
    let shotsLeft = workflow.item.system.uses.value;
    let selectedAmmo = workflow.actor.items.get(workflow.activity.ammunition);
    let isPiercing = genericUtils.getProperty(workflow.item, 'flags.chris-premades.firearm.piercing');
    if (!isPiercing && (!shotsLeft || !selectedAmmo?.system.quantity)) {
        genericUtils.notify('CHRISPREMADES.Firearm.OutOfAmmo', 'info');
        workflow.aborted = true;
        return true;
    }
    if (!isPiercing) await genericUtils.update(workflow.item, {'system.uses.spent': workflow.item.system.uses.spent + 1});
    const noConsume = genericUtils.getProperty(workflow.item, 'flags.chris-premades.firearm.noConsume');
    if (noConsume) await selectedAmmo.update({'system.quantity': selectedAmmo.system.quantity + 1});
    let viciousIntent = itemUtils.getItemByIdentifier(workflow.actor, 'viciousIntent');
    if (!viciousIntent) return;
    if ((workflow.activity.attack.critical.threshold ?? 20) < 20) return;
    workflow.activity.attack.critical.threshold = 19;
}
async function early({workflow}) {
    let adeptMarksman = itemUtils.getItemByIdentifier(workflow.actor, 'adeptMarksman');
    let currUses = adeptMarksman?.system.uses.value;
    if (!currUses) return;
    let isPiercing = genericUtils.getProperty(workflow.item, 'flags.chris-premades.firearm.piercing');
    if (isPiercing) return;
    let trickShots = ['dazingShot', 'deadeyeShot', 'disarmingShot', 'forcefulShot', 'violentShot', 'wingingShot'];
    let possibleItems = trickShots.map(i => itemUtils.getItemByIdentifier(workflow.actor, i)).filter(j => j);
    if (!possibleItems.length) return;
    let selectedShot = await dialogUtils.selectDocumentDialog('CHRISPREMADES.Firearm.TrickShot', 'CHRISPREMADES.Firearm.TrickShotSelect', possibleItems, {addNoneDocument: true});
    if (!selectedShot) return;
    let cost = 1;
    let createEffect = false;
    let effectData = {
        name: selectedShot.name,
        img: selectedShot.img,
        origin: selectedShot.uuid,
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    switch (genericUtils.getIdentifier(selectedShot)) {
        case 'dazingShot':
            effectUtils.addMacro(effectData, 'midi.actor', ['dazingShot']);
            createEffect = true;
            break;
        case 'deadeyeShot':
            workflow.advantage = true;
            workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + selectedShot.name);
            break;
        case 'disarmingShot':
            effectUtils.addMacro(effectData, 'midi.actor', ['disarmingShot']);
            createEffect = true;
            break;
        case 'forcefulShot':
            effectUtils.addMacro(effectData, 'midi.actor', ['forcefulShot']);
            createEffect = true;
            break;
        case 'violentShot': {
            let numSpent = await dialogUtils.selectDialog(selectedShot.name, 'CHRISPREMADES.Firearm.SelectViolent', {
                label: 'CHRISPREMADES.Firearm.Grit',
                name: 'grit',
                options: {
                    options: new Array(currUses).fill().map((_, ind) => ({label: (ind + 1).toString(), value: (ind + 1).toString()}))
                }
            });
            if (!numSpent?.length) return;
            cost = Number(numSpent);
            let currMisfire = itemUtils.getConfig(workflow.item, 'misfire');
            workflow.item = workflow.item.clone({'flags.chris-premades.firearm.violent': cost, 'flags.chris-premades.config.misfire': Number(currMisfire) + 2 * cost}, {keepId: true});
            workflow.item.prepareData();
            workflow.item.applyActiveEffects();
            break;
        }
        case 'wingingShot':
            effectUtils.addMacro(effectData, 'midi.actor', ['wingingShot']);
            createEffect = true;
            break;
    }
    await workflowUtils.completeItemUse(selectedShot);
    await genericUtils.update(adeptMarksman, {'system.uses.spent': adeptMarksman.system.uses.spent + cost});
    if (createEffect) {
        effectUtils.addMacro(effectData, 'midi.actor', ['removeOnMiss']);
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'trickShot'});
    }
}
async function late({workflow}) {
    let adeptMarksman = itemUtils.getItemByIdentifier(workflow.actor, 'adeptMarksman');
    if (!adeptMarksman) return;
    let viciousIntent = itemUtils.getItemByIdentifier(workflow.actor, 'viciousIntent');
    let hemorrhagingCritical = itemUtils.getItemByIdentifier(workflow.actor, 'hemorrhagingCritical');
    if (workflow.hitTargets.size !== 1) return;
    let critRoll = viciousIntent ? 19 : 20;
    let regained = 0;
    let ditem = workflow.damageItem;
    if (!workflow.damageItem.newHP && workflow.damageItem.oldHP) regained += 1;
    if (workflow.d20AttackRoll >= critRoll) {
        regained += 1;
        if (hemorrhagingCritical) {
            let damage = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
            damage = Math.floor(damage / 2);
            let effectData = {
                name: hemorrhagingCritical.name,
                img: hemorrhagingCritical.img,
                origin: hemorrhagingCritical.uuid,
                duration: {
                    seconds: 12
                },
                changes: [
                    {
                        key: 'flags.midi-qol.OverTime',
                        mode: 0,
                        value: 'turn=end,damageRoll=' + damage + ',damageType=' + workflow.defaultDamageType + ',label=' + hemorrhagingCritical.name,
                        priority: 20
                    }
                ],
                flags: {
                    dae: {
                        specialDuration: [
                            'turnEnd'
                        ]
                    }
                }
            };
            await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData);
            await workflowUtils.completeItemUse(hemorrhagingCritical);
        }
    }
    if (!regained) return;
    let max = adeptMarksman.system.uses.max;
    let value = adeptMarksman.system.uses.value ?? 0;
    if (value === max) return;
    regained = Math.clamp(regained, 0, max - value);
    await genericUtils.update(adeptMarksman, {'system.uses.spent': adeptMarksman.system.uses.spent - regained});
    genericUtils.notify(genericUtils.format('CHRISPREMADES.Firearm.GritRegain', {regained}), 'info');
}
async function damage({workflow}) {
    let violentCost = workflow.item.flags['chris-premades']?.firearm?.violent;
    if (!violentCost) return;
    let origRoll = await new Roll(workflow.item.system.damage.base.formula, workflow.item.getRollData()).evaluate();
    let faces = origRoll.terms[0].faces;
    if (!faces) return;
    let extraDamage = violentCost + 'd' + faces + '[' + workflow.defaultDamageType + ']';
    await workflowUtils.bonusDamage(workflow, extraDamage, {damageType: workflow.defaultDamageType});
}
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
    let ammunition = workflow.actor.items.filter(i => i.system.type?.value === 'ammo' && i.system.type.subtype === 'firearmBullet' && i.system.quantity);
    if (!ammunition.length) {
        genericUtils.notify('CHRISPREMADES.Firearm.NoAmmo', 'info');
        return;
    }
    let weapons = workflow.actor.items.filter(i => i.system.type?.value === 'firearm' && (i.system.uses.spent || !i.system.activities?.getByType('attack')[0]?.ammunition?.length || !workflow.actor.items.get(i.system.activities?.getByType('attack')[0]?.ammunition)?.system.quantity));
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
        'system.uses.spent': 0
    });
    await genericUtils.update(weapon.system.activities.getByType('attack')[0], {
        'ammunition': ammo.id
    });
}
export let firearm = {
    name: 'Firearm (CR)',
    version: '1.1.10',
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
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
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