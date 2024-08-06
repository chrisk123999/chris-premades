import {Summons} from '../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let pocketDimensionEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliarPocketDimension');
    if (pocketDimensionEffect) await genericUtils.remove(pocketDimensionEffect);
    let pocketData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Find Familiar: Pocket Dimension', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FindFamiliar.PocketDimension', identifier: 'findFamiliarPocketDimension'});
    let attackData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Find Familiar: Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FindFamiliar.Attack', identifier: 'findFamiliarAttack'});
    if (!pocketData || !attackData) {
        errors.missingPackItem();
        return;
    }
    let itemsToAdd = [pocketData, attackData];
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
    if (!name?.length) name = sourceActor.name + ' Familiar';
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
        let saveItems = sourceActor.items.filter(i => !!i.system.save.dc);
        let saveDC = itemUtils.getSaveDC(workflow.item);
        let itemUpdates = [];
        for (let i of weaponItems) {
            let properties = Array.from(i.system.properties);
            properties.push('mgc');
            itemUpdates.push({_id: i.id, 'system.properties': properties});
        }
        for (let i of saveItems) {
            let currItem = itemUpdates.find(j => j._id === i.id);
            if (currItem) {
                currItem.system.save.dc = saveDC;
            } else {
                itemUpdates.push({_id: i.id, 'system.save.dc': saveDC});
            }
        }
        genericUtils.setProperty(updates, 'actor.system.attributes.movement.' + movement, 40);
        // TODO: Uncomment & replace "undefined" once CPR Class Feature Item: Investment of the Chain Master - Command exists
        // let commandData = undefined;
        // if (!commandData) {
        //     errors.missingPackItem();
        //     return;
        // }
        // itemsToAdd.push(commandData);
        let resistanceData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.summonFeatures, 'Investment of the Chain Master: Familiar Resistance', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InvestmentOfTheChainMaster.Resistance', identifier: 'investmentOfTheChainMasterResistance'});
        if (!resistanceData) {
            errors.missingPackItem();
            return;
        }
        effectUtils.addMacro(resistanceData, 'midi.item', ['investmentOfTheChainMasterActive']);
        itemUpdates.push(resistanceData);
        genericUtils.setProperty(updates, 'actor.items', itemUpdates);
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    let spawnedTokens = await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 864000, 
        range: 10, 
        animation,
        additionalVaeButtons: itemsToAdd.map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
    if (!spawnedTokens?.length) return;
    let spawnedToken = spawnedTokens[0];
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
    effectUtils.addMacro(pocketData, 'midi.item', ['findFamiliarPocketDimension']);
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
            genericUtils.setProperty(updates, 'actor.system.attributes.hp', hpData);
            await genericUtils.remove(familiarToken);
            await spawnFamiliar(updates);
            await genericUtils.update(pocketDimensionEffect, {'flags.chris-premades.findFamiliarPocketDimension.sceneId': game.scenes.current.id});
        } else {
            let familiarToken = game.scenes.current.tokens.get(familiarTokenId);
            if (!familiarToken) {
                await error();
                return;
            }
            let hpData = familiarToken.actor.system.attributes.hp;
            genericUtils.setProperty(updates, 'actor.system.attributes.hp', hpData);
            await genericUtils.update(pocketDimensionEffect, {'flags.chris-premades.findFamiliarPocketDimension': {state: true, updates}});
            await genericUtils.remove(familiarToken);
        }
    } else {
        await spawnFamiliar(updates);
        await genericUtils.update(pocketDimensionEffect, {'flags.chris-premades.findFamiliarPocketDimension.state': false});
    }
    async function error() {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.Error', 'info');
        if (findFamiliarEffect) await genericUtils.remove(findFamiliarEffect);
    }
    async function spawnFamiliar(updates) {
        let sourceActor = await fromUuid(pocketFlags.familiarActorUuid);
        let findFamiliarItem = itemUtils.getItemByIdentifier(workflow.actor, 'findFamiliar');
        let spawnedTokens = await Summons.spawn(sourceActor, updates, findFamiliarItem, workflow.token, {
            duration: 864000, 
            range: 10, 
            animation: pocketFlags.animation
        });
        if (!spawnedTokens?.length) return;
        let spawnedToken = spawnedTokens[0];
        await genericUtils.update(findFamiliarEffect, {
            ['flags.chris-premades.summons.ids.' + findFamiliarEffect.name]: [spawnedToken.id],
            ['flags.chris-premades.summons.scenes.' + findFamiliarEffect.name]: [game.scenes.current.id]
        });
    }
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
            i18nOption: 'Celestial',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'feyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fey',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fiendAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fiend',
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