import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let pocketDimensionEffect = await chris.findEffect(workflow.actor, "Pocket Dimension");
    if (pocketDimensionEffect) await chris.removeEffect(pocketDimensionEffect);
    let pocketData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Find Familiar - Pocket Dimension', false);
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? 'Familiars';
    if (folder === '') folder = 'Familiars';
    let actors = game.actors.filter(i => i.folder?.name === folder);
    if (actors.length < 1) {
        ui.notifications.warn('No actors found in familiars folder! (Default named "Familiars")');
        return;
    }
    let sourceActor = await chris.selectDocument('Choose Familiar', actors);
    if (!sourceActor) return;
    let creatureType = await chris.dialog('What creature type?', [['Celestial', 'celestial'], ['Fey', 'fey'], ['Fiend', 'fiend']]);
    if (!creatureType) return;
    let name = await chris.getConfiguration(workflow.item, 'name');
    if (!name || name === '') name = sourceActor[0].name + ' Familiar';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'type': {
                        'value': creatureType
                    }
                }
            },
            'prototypeToken': {
                'name': name
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        }
    };
    let attackData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Find Familiar - Attack', false);
    if (!attackData) return;
    attackData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Find Familiar - Attack');
    delete attackData._id;
    let updates2 = {
        'embedded': {
            'Item': {
                [attackData.name]: attackData,
            }
        }
    };
    let updates3 = {
        'flags': {
            'chris-premades': {
                'spell': {
                    'findFamiliar': true
                },
                'vae': {
                    'button': attackData.name
                }
            }
        }
    };
    let investmentOfTheChainMaster = chris.getItem(workflow.actor, 'Eldritch Invocations: Investment of the Chain Master');
    if (investmentOfTheChainMaster) { 
        let movement = await chris.dialog(investmentOfTheChainMaster.name, [['Flying', 'fly'], ['Swimming', 'swim']], 'Which Movement Type?');
        let weaponItems = sourceActor[0].items.filter(i => i.type === 'weapon');
        let saveItems = sourceActor[0].items.filter(i => i.system.save.dc != null);
        for (let i of weaponItems) {
            let properties = Array.from(i.system.properties);
            properties.push('mgc');
            setProperty(updates, 'embedded.Item.' + i.name + '.system.properties', properties);
        }
        let saveDC = chris.getSpellDC(workflow.item);
        for (let i of saveItems) {
            setProperty(updates, 'embedded.Item.' + i.name + '.system.save.dc', saveDC);
        }
        setProperty(updates, 'actor.system.attributes.movement.' + movement, 40);
        let commandData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Investment of the Chain Master - Command', false);
        if (!commandData) return;
        commandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investment of the Chain Master - Command');
        let resistanceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Investment of the Chain Master - Familiar Resistance', false);
        if (!resistanceData) return;
        resistanceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investment of the Chain Master - Familiar Resistance');
        delete resistanceData._id;
        setProperty(updates, 'embedded.Item.Investment of the Chain Master - Familiar Resistance', resistanceData);
        setProperty(updates2, 'embedded.Item.Investment of the Chain Master - Command', commandData);
        setProperty(updates3, 'flags.effectmacro.onTurnStart.script', 'chrisPremades.macros.investmentOfTheChainMaster.turnStart(effect)');
    }
    let options = {
        'permanent': false,
        'name': 'Find Familiar',
        'description': 'Find Familiar'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let defaultAnimations = {
        'celestial': 'celestial',
        'fey': 'nature',
        'fiend': 'fire'
    };
    let animation = chris.getConfiguration(workflow.item, 'animation-' + creatureType) ?? defaultAnimations[creatureType];
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await summons.spawn(sourceActor, updates, 864000, workflow.item, workflow.token, workflow.item.system?.range?.value, {'spawnAnimation': animation});
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    setProperty(updates3, 'flags.effectmacro.onDelete.script', 'await chrisPremades.macros.findFamiliar.onDelete(actor, effect, scene); ' + effect.flags.effectmacro?.onDelete?.script + '; await warpgate.revert(token.document, "Find Familiar");');
    await chris.updateEffect(effect, updates3);
    async function effectMacro() {
        let findFamiliarEffect = chrisPremades.helpers.getEffects(actor).find(e => e.flags['chris-premades']?.spell?.findFamiliar);
        if (findFamiliarEffect) await chrisPremades.helpers.removeEffect(findFamiliarEffect);
        await warpgate.revert(token.document, "Pocket Dimension");
    }
    if (!pocketData) return;
    pocketData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Find Familiar - Pocket Dimension');
    let effectData = {
        'name': 'Pocket Dimension',
        'icon': pocketData.img,
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'findFamiliarPocketDimension': {
                        'sourceActorUuid': sourceActor[0].uuid,
                        'updates': updates,
                        'animation': animation,
                        'sceneId': game.scenes.current.id,
                        'actorUpdates': updates2,
                        'effectUpdates': updates3,
                        'state': false
                    }
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
    let updates4 = {
        'embedded': {
            'Item': {
                [pocketData.name]: pocketData,
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Pocket Dimension',
        'description': 'Find Familiar Pocket Dimension'
    };
    await warpgate.mutate(workflow.token.document, updates4, {}, options2);
}
async function attackApply({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliar);
    if (!effect) return;
    let familiarId = effect.flags['chris-premades']?.summons?.ids[effect.name][0];
    if (!familiarId) return;
    let familiarToken = canvas.scene.tokens.get(familiarId);
    if (!familiarToken) return;
    if (chris.getDistance(workflow.token, familiarToken) > 100) {
        ui.notifications.info('Familiar Too Far Away!');
        return;
    }
    let effectData = {
        'name': 'Find Familiar Attack',
        'icon': workflow.item.img,
        'origin': effect.origin.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.rangeOverride.attack.all',
                'mode': 0,
                'value': 1,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'priority': 20,
                'value': 'function.chrisPremades.macros.findFamiliar.attackEarly,preambleComplete'
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    '1Attack'
                ]
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
    await chris.createEffect(familiarToken.actor, effectData);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell' || workflow.item.system.range.units != 'touch') {
        ui.notifications.info('Invalid Spell Type!');
        return false;
    }
    let effect = chris.getEffects(workflow.actor).find((e) => e.value?.flags['chris-premades']?.spell?.findFamiliar);
    if (!effect) return;
    let familiarId = effect.flags['chris-premades']?.summons?.ids[effect.name][0];
    if (!familiarId) return;
    let familiarToken = canvas.scene.tokens.get(familiarId);
    if (!familiarToken) return;
    await chris.addCondition(familiarToken.actor, 'Reaction');
}
async function pocketDimension({speaker, actor, token, character, item, args, scope, workflow}) {
    let pocketDimensionEffect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliarPocketDimension);
    if (!pocketDimensionEffect) return;
    if (!pocketDimensionEffect.flags['chris-premades'].spell.findFamiliarPocketDimension.state) {
        let findFamiliarEffect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliar);
        if (!findFamiliarEffect) {
            await notFound();
            return;
        }
        let familiarTokenId = findFamiliarEffect.flags['chris-premades']?.summons?.ids?.[findFamiliarEffect.name][0];
        if (pocketDimensionEffect.flags['chris-premades'].spell.findFamiliarPocketDimension.sceneId != game.scenes.current.id) {
            let scene = game.scenes.get(pocketDimensionEffect.flags['chris-premades'].spell.findFamiliarPocketDimension.sceneId);
            if (!scene) return;
            let familiarToken = scene.tokens.get(familiarTokenId);
            if (!familiarToken) await notFound();
            let hpData = familiarToken.actor.system.attributes.hp;
            if (!hpData) return;
            let pocketDimensionData = pocketDimensionEffect.flags['chris-premades']?.spell?.findFamiliarPocketDimension;
            if (!pocketDimensionData) return;
            let sourceActorUuid = pocketDimensionData.sourceActorUuid;
            let updates = duplicate(pocketDimensionData.updates);
            setProperty(updates, 'actor.system.attributes.hp', hpData);
            let animation = pocketDimensionData.animation;
            let effectUpdates = pocketDimensionData.effectUpdates;
            let actorUpdates = pocketDimensionData.actorUpdates;
            await scene.deleteEmbeddedDocuments('Token', [familiarTokenId]); // may need a socket?
            await chris.updateEffect(findFamiliarEffect, {'flags.effectmacro': {}});
            await warpgate.revert(workflow.token.document, 'Find Familiar');
            await chris.removeEffect(findFamiliarEffect);
            await warpgate.wait(100);
            await spawnFamiliar(sourceActorUuid, updates, animation, actorUpdates, effectUpdates);
            await chris.updateEffect(pocketDimensionEffect, {'flags.chris-premades.spell.findFamiliarPocketDimension.sceneId': game.scenes.current.id});
        } else {
            let familiarToken = game.scenes.current.tokens.get(familiarTokenId);
            if (!familiarToken) await notFound();
            let hpData = familiarToken.actor.system.attributes.hp;
            await chris.updateEffect(pocketDimensionEffect, {'flags.chris-premades.spell.findFamiliarPocketDimension': {'state': true, 'hpData': hpData}});
            await chris.removeEffect(findFamiliarEffect);
        }
    } else {
        let pocketDimensionData = pocketDimensionEffect.flags['chris-premades']?.spell?.findFamiliarPocketDimension;
        if (!pocketDimensionData) return;
        let sourceActorUuid = pocketDimensionData.sourceActorUuid;
        let updates = duplicate(pocketDimensionData.updates);
        setProperty(updates, 'actor.system.attributes.hp', pocketDimensionData.hpData);
        let animation = pocketDimensionData.animation;
        let actorUpdates = pocketDimensionData.actorUpdates;
        let effectUpdates = pocketDimensionData.effectUpdates;
        await spawnFamiliar(sourceActorUuid, updates, animation, actorUpdates, effectUpdates);
        await chris.updateEffect(pocketDimensionEffect, {'flags.chris-premades.spell.findFamiliarPocketDimension': {'sceneId': game.scenes.current.id, 'state': false}});
    }
    async function notFound() {
        ui.notifications.info('No familiar token or data found!');
        await warpgate.revert(workflow.token.document, "Pocket Dimension");
        if (pocketDimensionEffect) await chris.removeEffect(pocketDimensionEffect);
    }
    async function spawnFamiliar(sourceActorUuid, updates, animation, actorUpdates, effectUpdates) {
        let sourceActor = await fromUuid(sourceActorUuid);
        let options = {
            'permanent': false,
            'name': 'Find Familiar',
            'description': 'Find Familiar'
        };
        await warpgate.mutate(workflow.token.document, actorUpdates, {}, options);
        let findFamiliarItem = chris.getItem(workflow.actor, 'Find Familiar');
        if (!findFamiliarItem) return;
        await summons.spawn([sourceActor], updates, 864000, findFamiliarItem, workflow.token, findFamiliarItem.system?.range?.value, {'spawnAnimation': animation});
        let effect = chris.findEffect(workflow.actor, findFamiliarItem.name);
        if (!effect) return;
        await chris.updateEffect(effect, effectUpdates);
    }
}
async function onDelete(actor, effect, scene) {
    let pocketDimensionEffect = chris.getEffects(actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliarPocketDimension);
    if (!pocketDimensionEffect) return;
    let familiarTokenId = effect.flags['chris-premades']?.summons?.ids[effect.name];
    if (!familiarTokenId) return;
    let familiarToken = scene.tokens.get(familiarTokenId[0]);
    if (!familiarToken) return;
    let hpData = familiarToken.actor.system.attributes.hp;
    if (!hpData) return;
    if (hpData.value === 0) {
        await chris.removeEffect(pocketDimensionEffect);
    } else {
        await chris.updateEffect(pocketDimensionEffect, {'flags.chris-premades.spell.findFamiliarPocketDimension': {'state': true, 'hpData': hpData}});
    }
}
export let findFamiliar = {
    'item': item,
    'attackApply': attackApply,
    'attackEarly': attackEarly,
    'pocketDimension': pocketDimension,
    'onDelete': onDelete
};