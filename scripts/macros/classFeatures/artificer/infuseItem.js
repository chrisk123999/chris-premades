import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';

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
    let maxItems = Math.floor((classLevel - 2) / 4) + 2;
    let existingInfusionUuids = workflow.item.flags['chris-premades']?.infusions ?? {};
    let willBeReplacing = existingInfusionUuids[selection];
    if (willBeReplacing) maxItems += 1;
    if (Object.keys(existingInfusionUuids).length >= maxItems && selection !== 'end') {
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
                    },
                    {
                        key: 'system.attunement',
                        mode: 5,
                        value: 'required',
                        priority: 20
                    }
                ]
            };
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
            let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Armor of Magical Strength: Resist Prone', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.ResistProne', identifier: 'infuseItemResistProne'});
            if (!featureData) {
                errors.missingPackItem();
                return;
            }
            featureData.system.consume.target = selectedItem.id;
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
                    },
                    {
                        key: 'system.attunement',
                        mode: 5,
                        value: 'required',
                        priority: 20
                    }
                ]
            };
            let enchantEffect = await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            await effectUtils.createEffect(selectedItem, effectData, {parentEntity: enchantEffect, strictlyInterdependent: true});
            await itemUtils.createItems(target, [featureData], {favorite: true, parentEntity: enchantEffect});
            await genericUtils.update(selectedItem, {'system.uses.value': 6});
            break;
        }
        case 'enhancedDefense': {
            let armor = target.items.filter(i => i.type === 'equipment' && !i.system.properties.has('mgc') && i.system.isArmor && i.system.equipped);
            if (!armor.length) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoArmor', 'info');
                return;
            }
            if (armor.length === 1) {
                selectedItem = armor[0];
            } else {
                selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', armor);
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
                        key: 'system.armor.magicalBonus',
                        mode: 5,
                        value: classLevel > 9 ? 2 : 1,
                        priority: 20
                    }
                ]
            };
            await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
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
        case 'homunculusServant': {
            break;
        }
        case 'radiantWeapon': {
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
                        value: 1,
                        priority: 20
                    },
                    {
                        key: 'system.attunement',
                        mode: 5,
                        value: 'required',
                        priority: 20
                    }
                ]
            };
            let lightFeatureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Radiant Weapon: Light', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.RadiantLight', identifier: 'radiantWeaponLight'});
            let blindFeatureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Radiant Weapon: Blind', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.RadiantBlind', identifier: 'radiantWeaponBlind', flatDC: target.system.attributes.spelldc});
            if (!lightFeatureData || !blindFeatureData) {
                errors.missingPackItem();
                return;
            }
            let enchantEffect = await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            await itemUtils.createItems(target, [lightFeatureData], {favorite: true, parentEntity: enchantEffect});
            await itemUtils.createItems(target, [blindFeatureData], {parentEntity: enchantEffect});
            break;
        }
        case 'repeatingShot': {
            let weapons = target.items.filter(i => i.type === 'weapon' && i.system.properties.has('amm') && !i.system.properties.has('mgc') && i.system.equipped);
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
                        key: 'system.properties',
                        mode: 2,
                        value: '-lod',
                        priority: 20
                    },
                    {
                        key: 'system.magicalBonus',
                        mode: 5,
                        value: 1,
                        priority: 20
                    },
                    {
                        key: 'system.consume.amount',
                        mode: 5,
                        value: 0,
                        priority: 20
                    },
                    {
                        key: 'system.attunement',
                        mode: 5,
                        value: 'required',
                        priority: 20
                    }
                ]
            };
            await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            break;
        }
        case 'repulsionShield': {
            let armor = target.items.filter(i => i.system.isArmor && i.system.type?.value === 'shield' && !i.system.properties.has('mgc') && i.system.equipped);
            if (!armor.length) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoShield', 'info');
                return;
            }
            let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Repulsion Shield: Push', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.RepulsionPush', identifier: 'repulsionShieldPush'});
            if (!featureData) {
                errors.missingPackItem();
                return;
            }
            if (armor.length === 1) {
                selectedItem = armor[0];
            } else {
                selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichShield', armor);
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
                        key: 'system.armor.magicalBonus',
                        mode: 5,
                        value: 1,
                        priority: 20
                    },
                    {
                        key: 'system.attunement',
                        mode: 5,
                        value: 'required',
                        priority: 20
                    }
                ]
            };
            let enchantEffect = await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            itemUtils.createItems(target, [featureData], {parentEntity: enchantEffect});
            break;
        }
        case 'resistantArmor': {
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
            let buttons = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'].map(i => ([CONFIG.DND5E.damageTypes[i].label, Object.keys(CONFIG.DND5E.damageTypes).find(j => j === i)]));
            if (!buttons.length) return;
            let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.ResistanceType', buttons);
            if (!damageType) return;
            originalName = selectedItem.name;
            let effectData = {
                name: workflow.item.name + ': ' + infusionLabel,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'system.traits.dr.value',
                        mode: 2,
                        value: damageType,
                        priority: 20
                    }
                ]
            };
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
                        key: 'system.attunement',
                        mode: 5,
                        value: 'required',
                        priority: 20
                    }
                ]
            };
            let enchantEffect = await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            await effectUtils.createEffect(selectedItem, effectData, {parentEntity: enchantEffect, strictlyInterdependent: true});
            break;
        }
        case 'returningWeapon': {
            let weapons = target.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.properties.has('thr') && i.system.equipped);
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
                        value: 1,
                        priority: 20
                    }
                ]
            };
            await itemUtils.enchantItem(selectedItem, enchantData, {identifier: selection});
            break;
        }
        case 'spellRefuelingRing': {
            let itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Spell-Refueling Ring', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.SpellRefuelingRing', identifier: 'spellRefuelingRing'});
            if (!itemData) {
                errors.missingPackItem();
                return;
            }
            [selectedItem] = await itemUtils.createItems(target, [itemData], {favorite: true});
            originalName = selectedItem.name;
            break;
        }
        case 'end': {
            for (let [currSelection, uuid] of Object.entries(existingInfusionUuids)) {
                let current = await fromUuid(uuid);
                if (!current) continue;
                if (['spellRefuelingRing'].includes(currSelection)) {
                    await genericUtils.remove(current);
                } else {
                    let effect = Array.from(current.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === currSelection);
                    if (effect) await genericUtils.remove(effect);
                }
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
        if (['spellRefuelingRing'].includes(selection)) {
            await genericUtils.remove(existingItem);
        } else {
            let effect = Array.from(existingItem.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === selection);
            if (effect) await genericUtils.remove(effect);
        }
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
async function armorStrengthLate({workflow}) {
    let effect = effectUtils.getEffectByStatusID(workflow.actor, 'prone');
    if (effect) await genericUtils.remove(effect);
}
async function repulsionShieldLate({workflow}) {
    if (!workflow.targets.size === 1) return;
    await tokenUtils.pushToken(workflow.token, workflow.targets.first(), 15);
}
async function spellRingLate({workflow}) {
    let {value: pact, max: pactMax, level: pactLevel} = workflow.actor.system.spells.pact;
    let {value: spell1, max: spell1Max} = workflow.actor.system.spells.spell1;
    let {value: spell2, max: spell2Max} = workflow.actor.system.spells.spell2;
    let {value: spell3, max: spell3Max} = workflow.actor.system.spells.spell3;
    let buttons = [];
    if (pactLevel <= 3 && pact < pactMax) buttons.push([CONFIG.DND5E.spellPreparationModes.pact.label, 'pact']);
    if (spell1 < spell1Max) buttons.push([CONFIG.DND5E.spellLevels[1], 'spell1']);
    if (spell2 < spell2Max) buttons.push([CONFIG.DND5E.spellLevels[2], 'spell2']);
    if (spell3 < spell3Max) buttons.push([CONFIG.DND5E.spellLevels[3], 'spell3']);
    if (!buttons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoMissing', 'info');
        return;
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Generic.RecoverSpellSlot', buttons);
    if (!selection?.length) return;
    let key = 'system.spells.' + selection + '.value';
    let value = genericUtils.getProperty(workflow.actor, key);
    await genericUtils.update(workflow.actor, {[key]: value + 1});
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
                    label: 'CHRISPREMADES.Macros.InfuseItem.EnhancedDefense',
                    value: 'enhancedDefense'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.EnhancedWeapon',
                    value: 'enhancedWeapon'
                },
                // {
                //     label: 'CHRISPREMADES.Macros.InfuseItem.HomunculusServant',
                //     value: 'homunculusServant'
                // },
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
export let infuseItemArmorStrength = {
    name: 'Infuse Item: Armor of Magical Strength',
    version: infuseItem.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: armorStrengthLate,
                priority: 50
            }
        ]
    }
};
export let infuseItemRepulsionShield = {
    name: 'Infuse Item: Repulsion Shield',
    version: infuseItem.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: repulsionShieldLate,
                priority: 50
            }
        ]
    }
};
export let infuseItemSpellRing = {
    name: 'Infuse Item: Spell-Refueling Ring',
    version: infuseItem.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: spellRingLate,
                priority: 50
            }
        ]
    }
};