import {Summons} from '../../lib/summons.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils} from '../../utils.js';

async function use({workflow}) {
    let findFamiliarEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (findFamiliarEffect) await genericUtils.remove(findFamiliarEffect);
    let pocketData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Find Familiar: Pocket Dimension', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FindFamiliar.PocketDimension', identifier: 'findFamiliarPocketDimension'});
    let touchData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Find Familiar: Touch', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FindFamiliar.Touch', identifier: 'findFamiliarTouch'});
    if (!pocketData || !touchData) {
        errors.missingPackItem();
        return;
    }
    let itemsToAdd = [pocketData, touchData];
    let folder = itemUtils.getConfig(workflow.item, 'folder');
    if (!folder?.length) folder = 'Familiars';
    let actors = game.actors.filter(i => i.folder?.name === folder);
    if (!actors.length) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Error.NoActors', {folder}), 'warn', {localize: false});
        return;
    }
    let sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.FindFamiliar.Choose', actors);
    if (!sourceActor) return;
    let creatureButtons = [
        ['DND5E.CreatureCelestial', 'celestial'],
        ['DND5E.CreatureFey', 'fey'],
        ['DND5E.CreatureFiend', 'fiend']
    ];
    let creatureType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.FindSteed.Type', creatureButtons);
    if (!creatureType) return;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.format('CHRISPREMADES.Summons.FamiliarDefault', {option: sourceActor.name});
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    type: {
                        value: creatureType
                    }
                }
            },
            prototypeToken: {
                name
            }
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let investmentOfTheChainMaster = itemUtils.getItemByIdentifier(workflow.actor, 'investmentOfTheChainMaster');
    if (investmentOfTheChainMaster) {
        let movementButtons = [
            ['DND5E.MovementFly', 'fly'],
            ['DND5E.MovementSwim', 'swim']
        ];
        let movement = await dialogUtils.buttonDialog(investmentOfTheChainMaster.name, 'CHRISPREMADES.Macros.FindFamiliar.Movement', movementButtons);
        let weaponItems = sourceActor.items.filter(i => i.type === 'weapon');
        let saveItems = sourceActor.items.filter(i => !!i.system?.save?.dc);
        let saveDC = itemUtils.getSaveDC(workflow.item);
        let itemUpdates = [];
        for (let i of weaponItems) {
            let properties = Array.from(i.system.properties);
            properties.push('mgc');
            itemUpdates.push({_id: i.id, system: {properties}});
        }
        for (let i of saveItems) {
            let currItem = itemUpdates.find(j => j._id === i.id);
            if (currItem) {
                currItem.system.save = {dc: saveDC};
            } else {
                itemUpdates.push({_id: i.id, system: {save: {dc: saveDC}}});
            }
        }
        genericUtils.setProperty(updates, 'actor.system.attributes.movement.' + movement, 40);
        let commandData = await compendiumUtils.getItemFromCompendium(constants.packs.classFeatureItems, 'Find Familiar: Command', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FindFamiliar.Command', identifier: 'findFamiliarCommand'});
        if (!commandData) {
            errors.missingPackItem();
            return;
        }
        itemsToAdd.push(commandData);
        let resistanceData = await Summons.getSummonItem('Investment of the Chain Master: Familiar Resistance', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.InvestmentOfTheChainMaster.Resistance', identifier: 'investmentOfTheChainMasterResistance'});
        if (!resistanceData) {
            errors.missingPackItem();
            return;
        }
        itemUpdates.push(resistanceData);
        genericUtils.setProperty(updates, 'actor.items', itemUpdates);
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 10, 
        animation,
        additionalVaeButtons: itemsToAdd.map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (!casterEffect) return;
    if (investmentOfTheChainMaster) {
        await genericUtils.update(casterEffect, {'flags.chris-premades.macros.combat': ['investmentOfTheChainMasterActive']});
    }
    // Slice to keep from adding pocket quite yet
    await itemUtils.createItems(workflow.actor, itemsToAdd.slice(1), {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: casterEffect});
    let effectData = {
        name: pocketData.name,
        img: pocketData.img,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                findFamiliarPocketDimension: {
                    familiarActorUuid: sourceActor.uuid,
                    updates,
                    animation,
                    sceneId: game.scenes.current.id,
                    state: false
                }
            }
        }
    };
    let newPocketEffect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: casterEffect, identifier: 'findFamiliarPocketDimension'});
    await itemUtils.createItems(workflow.actor, [pocketData], {favorite: true, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures'), parentEntity: newPocketEffect});
}
async function pocketDimension({workflow}) {
    let pocketDimensionEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliarPocketDimension');
    if (!pocketDimensionEffect) return;
    let pocketFlags = pocketDimensionEffect.flags['chris-premades'].findFamiliarPocketDimension;
    let findFamiliarEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (!findFamiliarEffect) {
        // This literally shouldn't be possible
        await error();
        return;
    }
    let updates = genericUtils.duplicate(pocketFlags.updates);
    if (!pocketFlags.state) {
        let familiarTokenId = findFamiliarEffect.flags['chris-premades'].summons.ids[findFamiliarEffect.name][0];
        if (pocketFlags.sceneId !== game.scenes.current.id) {
            let scene = game.scenes.get(pocketFlags.sceneId);
            if (!scene) return;
            let familiarToken = scene.tokens.get(familiarTokenId);
            if (!familiarToken) {
                await error();
                return;
            }
            let hpData = familiarToken.actor.system.attributes.hp;
            if (!hpData) return;
            let effectsData = [];
            for (let currEffect of familiarToken.actor.effects) {
                if (genericUtils.getIdentifier(currEffect) === 'summonedEffect') {
                    continue;
                }
                if (currEffect.flags?.['chris-premades']?.concentrationEffectUuid) {
                    await genericUtils.remove(currEffect);
                    continue;
                }
                let originItem = await fromUuid(currEffect.origin);
                if (originItem) {
                    if (originItem instanceof Item.implementation && effectUtils.getConcentrationEffect(originItem.parent, originItem)) {
                        await genericUtils.remove(currEffect);
                        continue;
                    } else {
                        originItem = await fromUuid(originItem.origin);
                        if (originItem && originItem instanceof Item.implementation && effectUtils.getConcentrationEffect(originItem.parent, originItem)) {
                            await genericUtils.remove(currEffect);
                            continue;
                        }
                    }
                }
                effectsData.push(currEffect.toObject());
            }
            genericUtils.setProperty(updates, 'actor.system.attributes.hp', hpData);
            genericUtils.setProperty(updates, 'actor.effects', effectsData);
            await genericUtils.remove(familiarToken);
            let spawned = await spawnFamiliar(updates);
            if (spawned) await genericUtils.update(pocketDimensionEffect, {'flags.chris-premades.findFamiliarPocketDimension.sceneId': game.scenes.current.id});
        } else {
            let familiarToken = game.scenes.current.tokens.get(familiarTokenId);
            if (!familiarToken) {
                await error();
                return;
            }
            let hpData = familiarToken.actor.system.attributes.hp;
            let effectsData = [];
            for (let currEffect of familiarToken.actor.effects) {
                if (genericUtils.getIdentifier(currEffect) === 'summonedEffect') {
                    continue;
                }
                if (currEffect.flags?.['chris-premades']?.concentrationEffectUuid) {
                    await genericUtils.remove(currEffect);
                    continue;
                }
                let originItem = await fromUuid(currEffect.origin);
                if (originItem) {
                    if (originItem instanceof Item.implementation && effectUtils.getConcentrationEffect(originItem.parent, originItem)) {
                        await genericUtils.remove(currEffect);
                        continue;
                    } else {
                        originItem = await fromUuid(originItem.origin);
                        if (originItem && originItem instanceof Item.implementation && effectUtils.getConcentrationEffect(originItem.parent, originItem)) {
                            await genericUtils.remove(currEffect);
                            continue;
                        }
                    }
                }
                effectsData.push(currEffect.toObject());
            }
            genericUtils.setProperty(updates, 'actor.system.attributes.hp', hpData);
            genericUtils.setProperty(updates, 'actor.effects', effectsData);
            await genericUtils.update(pocketDimensionEffect, {'flags.chris-premades.findFamiliarPocketDimension': {state: true, updates}});
            await genericUtils.remove(familiarToken);
        }
    } else {
        let spawned = await spawnFamiliar(updates);
        if (spawned) await genericUtils.update(pocketDimensionEffect, {'flags.chris-premades.findFamiliarPocketDimension.state': false});
    }
    async function error() {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.Error', 'info');
        if (findFamiliarEffect) await genericUtils.remove(findFamiliarEffect);
    }
    async function spawnFamiliar(updates) {
        let sourceActor = await fromUuid(pocketFlags.familiarActorUuid);
        let findFamiliarItem = itemUtils.getItemByIdentifier(workflow.actor, 'findFamiliar');
        let effectsToKeep = [];
        for (let effect of updates.actor?.effects ?? []) {
            let duration = effect?.duration;
            if (!duration) {
                effectsToKeep.push(effect);
                continue;
            }
            let timePassed = game.time.worldTime - duration.startTime;
            if (timePassed < (duration.rounds ?? 0) * 6) {
                effectsToKeep.push(effect);
                continue;
            }
            if (timePassed < (duration.seconds ?? 0)) {
                effectsToKeep.push(effect);
                continue;
            }
        }
        if (updates.actor?.effects?.length) {
            updates.actor.effects = effectsToKeep;
        }
        let spawnedTokens = await Summons.spawn(sourceActor, updates, findFamiliarItem, workflow.token, {
            duration: 864000, 
            range: 30, 
            animation: pocketFlags.animation
        });
        if (!spawnedTokens?.length) return;
        let spawnedToken = spawnedTokens[0];
        await genericUtils.update(findFamiliarEffect, {
            ['flags.chris-premades.summons.ids.' + findFamiliarEffect.name]: [spawnedToken.id],
            ['flags.chris-premades.summons.scenes.' + findFamiliarEffect.name]: [game.scenes.current.id]
        });
        return true;
    }
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (!effect) return;
    let familiarToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!familiarToken || tokenUtils.getDistance(workflow.token, familiarToken) > 100) {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.TooFar', 'info');
        return;
    }
    if (actorUtils.hasUsedReaction(familiarToken.actor)) {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.ReactionUsed', 'info');
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
                    '1Attack'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['findFamiliarTouch']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, effectData);
    await effectUtils.createEffect(familiarToken.actor, effectData, {parentEntity: casterEffect});
}
async function early({workflow}) {
    if (workflow.item.type !== 'spell' || workflow.item.system.range.units !== 'touch') {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.InvalidSpell', 'info');
        workflow.aborted = true;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (!effect) {
        workflow.aborted = true;
        return;
    }
    let familiarToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!familiarToken) {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.TooFar', 'info');
        workflow.aborted = true;
        return;
    }
    await actorUtils.setReactionUsed(familiarToken.actor);
}
export let findFamiliar = {
    name: 'Find Familiar',
    version: '0.12.9',
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
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Familiar',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'folder',
            label: 'CHRISPREMADES.Summons.Folder',
            type: 'text',
            default: 'Familiars',
            category: 'summons'
        },
        {
            value: 'celestialAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'DND5E.CreatureCelestial',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'feyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'DND5E.CreatureFey',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fiendAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'DND5E.CreatureFiend',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let findFamiliarPocketDimension = {
    name: 'Find Familiar: Pocket Dimension',
    version: findFamiliar.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: pocketDimension,
                priority: 50
            }
        ]
    }
};
export let findFamiliarTouch = {
    name: 'Find Familiar: Touch',
    version: findFamiliar.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};