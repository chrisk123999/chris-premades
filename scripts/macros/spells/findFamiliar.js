import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
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
    let name = await chris.getConfiguration(workflow.item, 'name') ?? sourceActor.name + ' Familiar';
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
    let updates2 = {
        'embedded': {
            'Item': {
                [attackData.name]: attackData
            }
        }
    }
    let updates3 = {
        'flags': {
            'chris-premades': {
                'spell': {
                    'findFamiliar': true
                },
                'vae': {
                    'button': attackData.name
                },
            }
        }
    }
    if (chris.getItem(workflow.actor, 'Eldritch Invocations: Investment of the Chain Master')) { 
        let movement = await chris.dialog('Which Movement Type?', [['Flying', 'fly'], ['Swimming', 'swim']]);
        let weaponItems = sourceActor[0].items.filter(i => i.type === 'weapon');
        let saveItems = sourceActor[0].items.filter(i => i.system.save.dc != null);
        for (let i of weaponItems) {
            setProperty(updates, 'embedded.Item.' + i.name + '.system.properties.mgc', true);
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
    await summons.spawn(sourceActor, updates, 86400, workflow.item);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    await chris.updateEffect(effect, updates3);
}
async function attackApply({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = workflow.actor.effects.find((e) => e?.flags['chris-premades']?.spell?.findFamiliar === true);
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
        'icon': '',
        'origin': effect.origin.uuid,
        'duration': {
            'turns': 1
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
                'transfer': false,
                'specialDuration': [
                    '1Attack'
                ],
                'stackable': 'none',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
    await chris.createEffect(familiarToken.actor, effectData);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell' || workflow.item.system.range.units != 'touch') {
        ui.notifications.info('Invalid Spell Type!');
        return false;
    }
    let effect = workflow.actor.effects.find((e) => e.value?.flags['chris-premades']?.spell?.findFamiliar === true);
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
}