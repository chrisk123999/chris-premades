/*import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
export async function conjureAnimals({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let findFamiliarEffect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliar);
    let totalSummons = findFamiliarEffect ? spellLevel : spellLevel + 1;
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? game.settings.get('chris-premades', 'Summons Folder');
    if (!folder && folder === '') folder = 'Chris Premades';
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? 'Familiars';
    if (folder === '') folder = 'Familiars';
    let actors = game.actors.filter(i => i.folder?.name === folder);
    if (actors.length < 1) {
        ui.notifications.warn('No actors found in familiars folder! (Default named "Familiars")');
        return;
    }
    let sourceActors = await chris.selectDocuments('Select Familiars (Max ' + totalSummons + ')', actors);
    if (!sourceActors) return;
    if (sourceActors.length > (totalSummons * 2 / selection)) {
        ui.notifications.info('Too many selected, try again!');
        return;
    }
    let pocketDimensionEffect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliarPocketDimension);
    let creatureType = pocketDimensionEffect?.updates?.actor?.system?.details?.type?.value ?? await chris.dialog('What creature type?', [['Celestial', 'celestial'], ['Fey', 'fey'], ['Fiend', 'fiend']]);
    let updates = [];
    let investmentOfTheChainMaster = chris.getItem(workflow.actor, 'Eldritch Invocations: Investment of the Chain Master');
    let movement = await chris.dialog(investmentOfTheChainMaster.name, [['Flying', 'fly'], ['Swimming', 'swim']], 'Which Movement Type?');
    for (let i of sourceActors) {
        let updates2 = {
            'actor': {
                'name': i.name + ' Familiar',
                'system': {
                    'details': {
                        'type': {
                            'value': creatureType
                        }
                    }
                },
                'prototypeToken': {
                    'name': i.name + ' Familiar'
                }
            },
            'token': {
                'name': i.name + ' Familiar',
                'disposition': workflow.token.document.disposition
            }
        }
        if (investmentOfTheChainMaster) { 
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
            let resistanceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Investment of the Chain Master - Familiar Resistance', false);
            if (!resistanceData) return;
            resistanceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investment of the Chain Master - Familiar Resistance');
            setProperty(updates, 'embedded.Item.Investment of the Chain Master - Familiar Resistance', resistanceData);
        }
        updates.push(updates2)
    }
    if (investmentOfTheChainMaster) { 
        let commandData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Investment of the Chain Master - Command', false);
        if (!commandData) return;
        commandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investment of the Chain Master - Command');
    setProperty(updates2, 'embedded.Item.Investment of the Chain Master - Command', commandData);
    setProperty(updates3, 'flags.effectmacro.onTurnStart.script', 'chrisPremades.macros.investmentOfTheChainMaster.turnStart(effect)');
//need to collapse this
    //let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'nature';
    //if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    //await summons.spawn(sourceActors, updates, 3600, workflow.item, undefined, undefined, 60, workflow.token, animation);
    let attackData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Find Familiar - Attack', false);
    if (!attackData) return;
    attackData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Find Familiar - Attack');
    let updates2 = {
        'embedded': {
            'Item': {
                [attackData.name]: attackData
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
    await summons.spawn(sourceActor, updates, 86400, workflow.item, undefined, undefined, 10, workflow.token, animation);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    setProperty(updates3, 'flags.effectmacro.onDelete.script', effect.flags.effectmacro?.onDelete?.script + '; await warpgate.revert(token.document, "Find Familiar");');
    await chris.updateEffect(effect, updates3);
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
export let findFamiliar = {
    'item': item,
    'attackApply': attackApply,
    'attackEarly': attackEarly
};
*/