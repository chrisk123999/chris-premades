import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let knownInfusions = itemUtils.getConfig(workflow.item, 'knownInfusions');
    let target = workflow.targets.first()?.actor ?? workflow.actor;
    let classLevel = workflow.actor.classes?.artificer?.system?.levels;
    if (!classLevel) return;
    if (!knownInfusions?.length) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoKnown', 'info');
        return;
    }
    let buttons = infuseItem.config[0].options.filter(i => knownInfusions.includes(i.value)).map(j => [j.label, j.value]);
    buttons.push(['CHRISPREMADES.Macros.InfuseItem.EndAll', 'end']);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.Select', buttons);
    if (!selection?.length) return;
    let maxItems = 2; // TODO
    let existingInfusionUuids = workflow.item.flags['chris-premades']?.infusions ?? {};
    if (Object.keys(existingInfusionUuids).length > maxItems) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.TooMany');
        return;
    }
    let infusionLabel = genericUtils.translate(buttons.find(i => i[1] === selection)[0]);
    let originalName;
    let selectedItem;
    let chatMessageInfo = '';
    switch (selection) {
        case 'arcanePropulsionArmor': {
            let armor = target.items.filter(i => i.system.isArmor && i.system.type?.value !== 'shield' && !i.system.properties.has('mgc') && i.system.equipped);
            if (!armor.length) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoArmor', 'info');
                return;
            }
            if (armor.length === 1) {
                selectedItem = armor[0];
            } else {
                selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichArmor', armor);
                if (!selectedItem) return;
            }
            originalName = selectedItem.name;
            let effectData = {
                name: workflow.item.name + ': ' + infusionLabel,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'system.attributes.movement.walk',
                        mode: 2,
                        value: 5,
                        priority: 20
                    }
                ]
            };
            let itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Arcane Propulsion Gauntlet', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.ArcanePropulsionGauntlet', identifier: 'arcanePropulsionGauntlet'});
            if (!itemData) {
                errors.missingPackItem();
                return;
            }
            let enchantData = {
                name: workflow.item.name,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'name',
                        mode: 5,
                        value: '{} (' + workflow.item.name + ': ' + infusionLabel + ')',
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
            // await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection, effects: [effectData], items: [itemData.uuid]});
            let enchantEffect = await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            await effectUtils.createEffect(selectedItem, effectData, {parentEntity: enchantEffect, strictlyInterdependent: true});
            await itemUtils.createItems(target, [itemData], {favorite: true, parentEntity: enchantEffect});
            break;
        }
        case 'armorOfMagicalStrength': {
            let armor = target.items.filter(i => i.system.isArmor && i.system.type?.value !== 'shield' && !i.system.properties.has('mgc') && i.system.equipped);
            if (!armor.length) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoArmor', 'info');
                return;
            }
            if (armor.length === 1) {
                selectedItem = armor[0];
            } else {
                selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichArmor', armor);
                if (!selectedItem) return;
            }
            originalName = selectedItem.name;
            let effectData = {
                name: workflow.item.name + ': ' + infusionLabel,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'flags.midi-qol.optional.MagicalStrength.check.str',
                        mode: 2,
                        value: '@abilities.int.mod',
                        priority: 20
                    },
                    {
                        key: 'flags.midi-qol.optional.MagicalStrength.save.str',
                        mode: 2,
                        value: '@abilities.int.mod',
                        priority: 20
                    },
                    {
                        key: 'flags.midi-qol.optional.MagicalStrength.count',
                        mode: 5,
                        value: 'ItemUses.' + selectedItem.name + ' (' + workflow.item.name + ': ' + infusionLabel + ')',
                        priority: 20
                    }
                ]
            };
            // TODO: un-prone on manual reaction logic
            let enchantData = {
                name: workflow.item.name,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'name',
                        mode: 5,
                        value: '{} (' + workflow.item.name + ': ' + infusionLabel + ')',
                        priority: 20
                    },
                    {
                        key: 'system.properties',
                        mode: 2,
                        value: 'mgc',
                        priority: 20
                    },
                    {
                        key: 'system.uses.per',
                        mode: 5,
                        value: 'dawn',
                        priority: 20
                    },
                    {
                        key: 'system.uses.max',
                        mode: 5,
                        value: 6,
                        priority: 20
                    },
                    {
                        key: 'system.uses.recovery',
                        mode: 5,
                        value: '1d6',
                        priority: 20
                    },
                    {
                        key: 'system.uses.prompt',
                        mode: 5,
                        value: false,
                        priority: 20
                    },
                    {
                        key: 'system.activation.type',
                        mode: 5,
                        value: 'special',
                        priority: 20
                    }
                ]
            };
            let enchantEffect = await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            await effectUtils.createEffect(selectedItem, effectData, {parentEntity: enchantEffect, strictlyInterdependent: true});
            await genericUtils.update(selectedItem, {'system.uses.value': 6});
            break;
        }
        case 'enhancedWeapon': {
            let weapons = target.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.equipped);
            if (!weapons.length) {
                genericUtils.notify('CHRISPREMADES.Macros.ElementalWeapon.NoWeapons', 'info');
                return;
            }
            if (weapons.length === 1) {
                selectedItem = weapons[0];
            } else {
                selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', weapons);
                if (!selectedItem) return;
            }
            originalName = selectedItem.name;
            let enchantData = {
                name: workflow.item.name,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'name',
                        mode: 5,
                        value: '{} (' + workflow.item.name + ': ' + infusionLabel + ')',
                        priority: 20
                    },
                    {
                        key: 'system.properties',
                        mode: 2,
                        value: 'mgc',
                        priority: 20
                    },
                    {
                        key: 'system.magicalBonus',
                        mode: 5,
                        value: classLevel > 9 ? 2 : 1,
                        priority: 20
                    }
                ]
            };
            await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            break;
        }
        case 'end': {
            for (let [currSelection, uuid] of Object.entries(existingInfusionUuids)) {
                let current = await fromUuid(uuid);
                if (!current) continue;
                let effect = Array.from(current.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === currSelection);
                if (effect) await genericUtils.remove(effect);
                chatMessageInfo += '<p>' + genericUtils.format('CHRISPREMADES.Macros.InfuseItem.Override', {oldActorName: current.parent.name, infusionLabel: genericUtils.translate(buttons.find(i => i[1] === currSelection)[0]), itemName: current.name}) + '</p>';
            }
            await genericUtils.setFlag(workflow.item, 'chris-premades', '-=infusions', null);
            break;
        }
    }
    let existingInfusionUuid = existingInfusionUuids[selection];
    if (existingInfusionUuid) {
        let existingItem = await fromUuid(existingInfusionUuid);
        if (!existingItem) return; // Shouldn't even happen
        let effect = Array.from(existingItem.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === selection);
        if (effect) await genericUtils.remove(effect);
        chatMessageInfo += '<p>' + genericUtils.format('CHRISPREMADES.Macros.InfuseItem.Override', {oldActorName: existingItem.parent.name, infusionLabel, itemName: existingItem.name}) + '</p>';
    }
    if (selection !== 'end') {
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'infusions.' + selection, selectedItem.uuid);
        chatMessageInfo += '<p>' + genericUtils.format('CHRISPREMADES.Macros.InfuseItem.New', {newActorName: target.name, infusionLabel, itemName: originalName}) + '</p>';
    }
    ChatMessage.implementation.create({
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        content: chatMessageInfo
    });
}
export let infuseItem = {
    name: 'Infuse Item',
    version: '0.12.33',
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
            value: 'knownInfusions',
            label: 'CHRISPREMADES.Macros.InfuseItem.Known',
            type: 'select-many',
            default: [],
            options: [
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.ArcanePropulsionArmor',
                    value: 'arcanePropulsionArmor'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.ArmorOfMagicalStrength',
                    value: 'armorOfMagicalStrength'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.EnhancedWeapon',
                    value: 'enhancedWeapon'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.HomunculusServant',
                    value: 'homunculusServant'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.RadiantWeapon',
                    value: 'radiantWeapon'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.RepeatingShot',
                    value: 'repeatingShot'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.RepulsionShield',
                    value: 'repulsionShield'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.ResistantArmor',
                    value: 'resistantArmor'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.ReturningWeapon',
                    value: 'returningWeapon'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.SpellRefuelingRing',
                    value: 'spellRefuelingRing'
                }
            ],
            category: 'mechanics'
        },
    ]
};