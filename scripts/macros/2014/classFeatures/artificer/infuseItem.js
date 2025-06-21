import {Summons} from '../../../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

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
    let deadHomunculusServant = 
        !effectUtils.getEffectByIdentifier(workflow.actor, 'infuseItem') &&
        existingInfusionUuids.homunculusServant;
    if (deadHomunculusServant) {
        delete existingInfusionUuids.homunculusServant;
    }
    if (Object.keys(existingInfusionUuids).length >= maxItems && selection !== 'end') {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.TooMany');
        return;
    }
    let armorModifications = itemUtils.getItemByIdentifier(workflow.actor, 'armorModifications');
    armorModifications = armorModifications && target === workflow.actor;
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
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichArmor', armor, {addNoneDocument: true});
            if (!selectedItem) return;
            originalName = selectedItem.name;
            let effectData = {
                name: workflow.item.name + ': ' + infusionLabel,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'system.attributes.movement.walk',
                        mode: 2,
                        value: genericUtils.handleMetric(5),
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
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichArmor', armor, {addNoneDocument: true});
            if (!selectedItem) return;
            originalName = selectedItem.name;
            let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Armor of Magical Strength: Resist Prone', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.ResistProne', identifier: 'infuseItemResistProne'});
            if (!featureData) {
                errors.missingPackItem();
                return;
            }
            let activityId = Object.keys(featureData.system.activities)[0];
            featureData.system.activities[activityId].consumption.targets[0].target = selectedItem.id;
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
                    },
                    {
                        key: 'flags.midi-qol.optional.MagicalStrength.countAlt',
                        mode: 5,
                        value: 'reaction',
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
                        key: 'system.uses.recovery',
                        mode: 5,
                        value: '{period: "dawn", type: "formula", formula: "1d6"}',
                        priority: 20
                    },
                    {
                        key: 'system.uses.max',
                        mode: 5,
                        value: 6,
                        priority: 20
                    },
                    {
                        key: 'activities[utility].activation.type',
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
            break;
        }
        case 'enhancedArcaneFocus': {
            let focuses = target.items.filter(i => i.type === 'equipment' && !i.system.properties.has('mgc') && i.system.type.value === 'trinket' && i.system.equipped);
            if (!focuses.length) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoFocus', 'info');
                return;
            } else {
                selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichFocus', focuses);
                if (!selectedItem) return;
            }
            originalName = selectedItem.name;
            let effectData = {
                name: workflow.item.name + ': ' + infusionLabel,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                changes: [
                    {
                        key: 'system.bonuses.spell.attack',
                        mode: 2,
                        value: classLevel > 9 ? 2 : 1,
                        priority: 20
                    }
                ]
            };
            effectUtils.addMacro(effectData, 'midi.actor', ['wandOfTheWarMage']);
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
        case 'enhancedDefense': {
            let armor = target.items.filter(i => i.type === 'equipment' && !i.system.properties.has('mgc') && i.system.isArmor && i.system.equipped);
            if (!armor.length) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.NoArmor', 'info');
                return;
            }
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichArmor', armor, {addNoneDocument: true});
            if (!selectedItem) return;
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
            if (armorModifications) {
                let gauntlets = itemUtils.getItemByIdentifier(workflow.actor, 'thunderGauntlets');
                if (!gauntlets) gauntlets = itemUtils.getItemByIdentifier(workflow.actor, 'lightningLauncher');
                if (gauntlets && ![existingInfusionUuids.enhancedWeapon, existingInfusionUuids.radiantweapon].includes(gauntlets.uuid)) {
                    weapons.push(gauntlets);
                }
            }
            if (!weapons.length) {
                genericUtils.notify('CHRISPREMADES.Macros.ElementalWeapon.NoWeapons', 'info');
                return;
            }
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', weapons, {addNoneDocument: true});
            if (!selectedItem) return;
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
            let effect = await effectUtils.getEffectByIdentifier(workflow.actor, 'infuseItem');
            if (effect) {
                genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.AlreadyServant', 'info');
                return;
            }
            target = workflow.actor;
            let itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Heart of Homunculus Servant', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.HomunculusHeart', identifier: 'homunculusHeart'});
            if (!itemData) {
                errors.missingPackItem();
                return;
            }
            effect = await homunculusHelper(workflow);
            if (!effect) return;
            [selectedItem] = await itemUtils.createItems(target, [itemData]);
            originalName = selectedItem.name;
            await effectUtils.addDependent(selectedItem, [effect]);
            await effectUtils.addDependent(effect, [selectedItem]);
            break;
        }
        case 'radiantWeapon': {
            let weapons = target.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.equipped);
            if (armorModifications) {
                let gauntlets = itemUtils.getItemByIdentifier(workflow.actor, 'thunderGauntlets');
                if (!gauntlets) gauntlets = itemUtils.getItemByIdentifier(workflow.actor, 'lightningLauncher');
                if (gauntlets && ![existingInfusionUuids.enhancedWeapon, existingInfusionUuids.radiantweapon].includes(gauntlets.uuid)) {
                    weapons.push(gauntlets);
                }
            }
            if (!weapons.length) {
                genericUtils.notify('CHRISPREMADES.Macros.ElementalWeapon.NoWeapons', 'info');
                return;
            }
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', weapons, {addNoneDocument: true});
            if (!selectedItem) return;
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
            let blindFeatureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Radiant Weapon: Blind', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.RadiantBlind', identifier: 'radiantWeaponBlind', flatDC: target.system.attributes.spell.dc});
            if (!lightFeatureData || !blindFeatureData) {
                errors.missingPackItem();
                return;
            }
            let activityId = Object.keys(blindFeatureData.system.activities)[0];
            let spellSave = workflow.actor.system.attributes.spell.dc;
            blindFeatureData.system.activities[activityId].save.dc = {
                calculation: '',
                formula: spellSave.toString(),
                value: spellSave
            };
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
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', weapons, {addNoneDocument: true});
            if (!selectedItem) return;
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
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichShield', armor, {addNoneDocument: true});
            if (!selectedItem) return;
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
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichArmor', armor, {addNoneDocument: true});
            if (!selectedItem) return;
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
            selectedItem = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', weapons, {addNoneDocument: true});
            if (!selectedItem) return;
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
                        value: 'ret',
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
                if (['spellRefuelingRing', 'homunculusServant'].includes(currSelection)) {
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
        if (['spellRefuelingRing', 'homunculusServant'].includes(selection)) {
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
async function homunculusHelper(workflow) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Homunculus Servant');
    if (!sourceActor) return;
    let mendingData = await Summons.getSummonItem('Mending (Homunculus Servant)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Mending', identifier: 'homunculusServantMending'});
    let evasionData = await Summons.getSummonItem('Evasion', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Evasion', identifier: 'homunculusServantEvasion'});
    let forceStrikeData = await Summons.getSummonItem('Force Strike', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.InfuseItem.ForceStrike', identifier: 'homunculusServantForceStrike', flatAttack: true});
    let commandData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Homunculus Servant: Command', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.HomunculusCommand', identifier: 'homunculusServantCommand'});
    let channelMagicData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Homunculus Servant: Channel Magic', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfuseItem.ChannelMagic', identifier: 'homunculusServantChannelMagic'});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'homunculusServantDodge'});
    let itemsToAdd = [forceStrikeData, evasionData, dodgeData, mendingData];
    if (!itemsToAdd.every(i => i) || !channelMagicData) return;
    let classLevel = workflow.actor.classes?.artificer?.system?.levels;
    if (!classLevel) return;
    let hpValue = 1 + classLevel + workflow.actor.system.abilities.int.mod;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.HomunculusServant');
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    hp: {
                        formula: hpValue,
                        max: hpValue,
                        value: hpValue
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: itemsToAdd
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 5,
        animation,
        initiativeType: 'follows',
        additionalVaeButtons: [{type: 'use', name: commandData.name, identifier: 'homunculusServantCommand'}, {type: 'use', name: channelMagicData.name, identifier: 'homunculusServantChannelMagic'}],
        additionalSummonVaeButtons:
            itemsToAdd
                .filter(i => i.flags['chris-premades'].info.identifier !== 'homunculusServantEvasion')
                .map(i => ({type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier}))
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'infuseItem');
    if (!casterEffect) return;
    await itemUtils.createItems(workflow.actor, [commandData, channelMagicData], {favorite: true, parentEntity: casterEffect});
    return casterEffect;
}
async function homunculusLate({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'infuseItem');
    if (!effect) return;
    let homunculusToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!homunculusToken || tokenUtils.getDistance(workflow.token, homunculusToken) > 120) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.TooFar', 'info');
        return;
    }
    if (actorUtils.hasUsedReaction(homunculusToken.actor)) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.ReactionUsed', 'info');
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Spell'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['infuseItemHomunculusTouch']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, effectData);
    await effectUtils.createEffect(homunculusToken.actor, effectData, {parentEntity: casterEffect});
}
async function homunculusEarly({workflow}) {
    if (workflow.item.type !== 'spell' || workflow.item.system.range.units !== 'touch') {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.InvalidSpell', 'info');
        workflow.aborted = true;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'infuseItem');
    if (!effect) {
        workflow.aborted = true;
        return;
    }
    let homunculusServantToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!homunculusServantToken) {
        genericUtils.notify('CHRISPREMADES.Macros.InfuseItem.TooFar', 'info');
        workflow.aborted = true;
        return;
    }
    await actorUtils.setReactionUsed(homunculusServantToken.actor);
}
export let infuseItem = {
    name: 'Infuse Item',
    version: '1.0.0',
    hasAnimation: true,
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
                    label: 'CHRISPREMADES.Macros.InfuseItem.EnhancedArcaneFocus',
                    value: 'enhancedArcaneFocus'
                },
                {
                    label: 'CHRISPREMADES.Macros.InfuseItem.EnhancedDefense',
                    value: 'enhancedDefense'
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
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HomunculusServant',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HomunculusServant',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HomunculusServant',
            type: 'file',
            default: '',
            category: 'summons'
        }
        ,{
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.HomunculusServant',
            type: 'select',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
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
export let infuseItemHomunculusTouch = {
    name: 'Infuse Item: Homunculus Servant Touch',
    version: infuseItem.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: homunculusLate,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: homunculusEarly,
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