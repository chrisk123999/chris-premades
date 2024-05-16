import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) return;
    let findFamiliarEffect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliar);
    let totalSummons = findFamiliarEffect ? spellLevel : spellLevel + 1;
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? 'Familiars';
    if (folder === '') folder = 'Familiars';
    let actors = game.actors.filter(i => i.folder?.name === folder);
    if (actors.length < 1) {
        ui.notifications.warn('No actors found in familiars folder! (Default named "Familiars")');
        return;
    }
    let sourceActors = await chris.selectDocuments('Select Familiars (Max ' + totalSummons + ')', actors);
    if (!sourceActors) return;
    if (sourceActors.length > totalSummons) {
        ui.notifications.info('Too many selected, try again!');
        return;
    }
    let pocketDimensionEffect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.findFamiliarPocketDimension);
    let creatureType = pocketDimensionEffect?.updates?.actor?.system?.details?.type?.value ?? await chris.dialog('What creature type?', [['Celestial', 'celestial'], ['Fey', 'fey'], ['Fiend', 'fiend']]);
    let attackData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Flock of Familiars - Attack', false);
    if (!attackData) return;
    attackData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Flock of Familiars - Attack');
    let updates2 = {
        'embedded': {
            'Item': {
                [attackData.name]: attackData
            }
        }
    };
    let investmentOfTheChainMaster = chris.getItem(workflow.actor, 'Eldritch Invocations: Investment of the Chain Master');
    let resistanceData;
    let updates3 = {
        'flags': {
            'chris-premades': {
                'spell': {
                    'flockOfFamiliars': true
                },
                'vae': {
                    'button': attackData.name
                }
            }
        }
    };
    if (investmentOfTheChainMaster) { 
        let commandData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Investment of the Chain Master - Command', false);
        if (!commandData) return;
        commandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investment of the Chain Master - Command');
        resistanceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Investment of the Chain Master - Familiar Resistance', false);
        if (!resistanceData) return;
        resistanceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investment of the Chain Master - Familiar Resistance');
        if (!findFamiliarEffect) setProperty(updates2, 'embedded.Item.Investment of the Chain Master - Command', commandData);
        setProperty(updates3, 'flags.effectmacro.onTurnStart.script', 'chrisPremades.macros.investmentOfTheChainMaster.turnStart(effect)');
    }
    let updates = [];
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
        };
        if (investmentOfTheChainMaster) { 
            let movement = await chris.dialog(investmentOfTheChainMaster.name, [['Flying', 'fly'], ['Swimming', 'swim']], 'Which Movement Type for ' + i.name + '?');
            let weaponItems = i.items.filter(i => i.type === 'weapon');
            let saveItems = i.items.filter(i => i.system.save.dc != null);
            for (let j of weaponItems) {
                let properties = Array.from(j.system.properties);
                properties.push('mgc');
                setProperty(updates2, 'embedded.Item.' + j.name + '.system.properties', properties);
            }
            let saveDC = chris.getSpellDC(workflow.item);
            for (let j of saveItems) {
                setProperty(updates2, 'embedded.Item.' + j.name + '.system.save.dc', saveDC);
            }
            setProperty(updates2, 'actor.system.attributes.movement.' + movement, 40);
            setProperty(updates2, 'embedded.Item.Investment of the Chain Master - Familiar Resistance', resistanceData);
        }
        console.log(duplicate(updates2));
        updates.push(updates2);
    }
    console.log(updates);
    let options = {
        'permanent': false,
        'name': 'Flock of Familiars',
        'description': 'Flock of Familairs'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let defaultAnimations = {
        'celestial': 'celestial',
        'fey': 'nature',
        'fiend': 'fire'
    };
    let animation = chris.getConfiguration(workflow.item, 'animation-' + creatureType) ?? defaultAnimations[creatureType];
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await summons.spawn(sourceActors, updates, 3600, workflow.item, undefined, undefined, 10, workflow.token, animation);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    setProperty(updates3, 'flags.effectmacro.onDelete.script', effect.flags.effectmacro?.onDelete?.script + '; await warpgate.revert(token.document, "Flock of Familiars");');
    await chris.updateEffect(effect, updates3);
}
async function attackApply({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.flockOfFamiliars);
    if (!effect) return;
    let familiarsIds = effect.flags['chris-premades']?.summons?.ids[effect.name];
    if (!familiarsIds) return;
    let familiarsTokens = new Set(familiarsIds.map(id => canvas.scene.tokens.get(id)));
    if (!familiarsTokens) return;
    for (let i of familiarsTokens) {
        if (chris.getDistance(workflow.token, i) > 100) {
            familiarsTokens.delete(i);
        }
    }
    if (!familiarsTokens.size) {
        ui.notifications.info('Familiars are too far away!');
        return;
    }
    let effectData = {
        'name': 'Flock of Familiars Attack',
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
                'value': 'function.chrisPremades.macros.flockOfFamiliars.attackEarly,prePreambleComplete'
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
    for (let i of familiarsTokens) await chris.createEffect(i.actor, effectData);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    console.log('Prepreambling');
    if (workflow.item.type != 'spell' || workflow.item.system.range.units != 'touch') {
        ui.notifications.info('Invalid Spell Type!');
        return false;
    }
    let effect = chris.getEffects(workflow.actor).find((e) => e?.flags['chris-premades']?.spell?.flockOfFamiliars);
    if (!effect) return;
    await chris.addCondition(workflow?.rangeDetails?.attackingToken.document.actor, 'Reaction');
    let familiarsIds = effect.flags['chris-premades']?.summons?.ids[effect.name];
    if (!familiarsIds) return;
    let familiarsTokens = new Set(familiarsIds.map(id => canvas.scene.tokens.get(id)));
    if (!familiarsTokens) return;
    for (let i of familiarsTokens) {
        console.log(i.actor);
        let attackEffect = chris.findEffect(i.actor, 'Flock of Familiars Attack');
        if (!attackEffect) return;
        await chris.removeEffect(attackEffect);
    }
}
export let flockOfFamiliars = {
    'item': item,
    'attackApply': attackApply,
    'attackEarly': attackEarly
};