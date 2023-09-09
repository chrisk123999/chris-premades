import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog('What drake type?', [['Acid', 'acid'], ['Cold', 'cold'], ['Fire', 'fire'], ['Lightning','lightning'], ['Poison','poison']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Drake Companion');
    if (!sourceActor) return;
    let rangerLevel = workflow.actor.classes?.ranger?.system?.levels;
    if (!rangerLevel) return;
    let drakeUpgrades = Math.floor((rangerLevel + 1) / 8);
    let biteData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Bite (Drake Companion)', false);
    if (!biteData) return;
    biteData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Bite (Drake Companion)');
    let commandData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Drake Companion: Command', false);
    if (!commandData) return;
    commandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Drake Companion: Command');
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let essenceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Draconic Essence', false);
    if (!essenceData) return;
    essenceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Draconic Essence');
    let strikesData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Infused Strikes', false);
    if (!strikesData) return;
    strikesData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Infused Strikes');
    strikesData.system.damage.parts[0][0] += '[' + selection + ']';
    strikesData.system.damage.parts[0][1] = selection;
    let resistanceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Reflexive Resistance', false);
    if (!resistanceData) return;
    let resistanceMacro = resistanceData.flags['midi-qol'].onUseMacroName;
    resistanceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Reflexive Resistance');
    let resistanceUsesValue = actor.flags['chris-premades']?.feature?.reflexiveResistance;
    if (!resistanceUsesValue && drakeUpgrades == 2) actor.setFlag('chris-premades', 'feature.reflexiveResistance', actor.system.attributes.prof);
    resistanceData.system.uses.value = resistanceUsesValue;
    resistanceData.system.uses.max = workflow.actor.system.attributes.prof;
    let heighWidth = 1;
    let scale = '0.8';
    switch (drakeUpgrades) {
        case 1: 
            biteData.system.damage.parts[1][0] = '1d6[' + selection + ']';
            biteData.system.damage.parts[1][1] = selection;
            scale = '1';
        break;
        case 2:
            biteData.system.damage.parts[1][0] = '2d6[' + selection + ']';
            biteData.system.damage.parts[1][1] = selection;
            scale = '1';
            heighWidth = 2;
    }
    let hpFormula = 5 + (rangerLevel * 5);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Drake Companion (' + selection + ')';
    if (name === '') name = 'Drake Companion (' + selection + ')';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof)
                },
                'attributes': {
                    'hp': {
                        'formula': hpFormula,
                        'max': hpFormula,
                        'value': hpFormula
                    },
                    'ac': {
                        'flat': 14 + workflow.actor.system.attributes.prof
                    }
                },
                'traits': {
                    'di': {
                        'value': selection
                    }
                }
            },
            'prototypeToken': {
                'name': name
            },
            'flags': {
                'chris-premades': {
                    'drakeCompanion': {
                        'type': selection
                    }
                }
            }
        },
        'token': {
            'name': name,
            'height': heighWidth,
            'width': heighWidth,
            'texture': {
                'scaleX': scale,
                'scaleY': scale
            }
        },
        'embedded': {
            'Item': {
                [biteData.name]: biteData,
                [dodgeData.name]: dodgeData,
                [essenceData.name]: essenceData,
                [strikesData.name]: strikesData
            }
        }
    }
    switch (drakeUpgrades) {
        case 1:
            setProperty(updates, 'actor.system.attributes.movement.fly', '40');
            setProperty(updates, 'actor.system.traits.size', 'med');
        break;
        case 2:
            setProperty(updates, 'actor.system.attributes.movement.fly', '40');
            setProperty(updates, 'actor.system.traits.size', 'lg');
            setProperty(resistanceData, 'flags.midi-qol.onUseMacroName', (resistanceMacro + 'Summon'));
            setProperty(updates, 'embedded.Item.Reflexive Resistance', resistanceData);
    }
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar-' + selection);
    let tokenImg = chris.getConfiguration(workflow.item, 'token-' + selection);
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let spawnedToken = await tashaSummon.spawn(sourceActor, updates, 86400, workflow.item);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    if (drakeUpgrades > 0 ) {
        let effectUpdates = {
            'changes': [
                {
                    'key': 'system.traits.dr.value',
                    'mode': 0,
                    'priority': 20,
                    'value': selection
                }
            ]
        };
        await chris.updateEffect(effect, effectUpdates);
    }
    let updates2 = {
        'embedded': {
            'Item': {
                [commandData.name]: commandData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Drake Companion',
        'description': commandData.name
    };
    if (drakeUpgrades === 2) {
        setProperty(resistanceData, 'flags.midi-qol.onUseMacroName', (resistanceMacro + 'Actor'));
        setProperty(resistanceData, 'flags.chris-premades.feature.spawnedTokenUuid', spawnedToken.uuid);
        setProperty(updates2, 'embedded.Item.Reflexive Resistance', resistanceData);
    }
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "Drake Companion");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': resistanceData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates); 
}
async function longRest(actor, data) {
    if (!data.longRest) return;
    if (actor.classes?.ranger?.system?.levels < 15) return;
    let item = actor.items.getName('Drakewarden');
    if (!item) return;
    if (item.type != 'subclass') return;
    actor.setFlag('chris-premades', 'feature.reflexiveResistance', actor.system.attributes.prof);
}
async function onSummon({speaker, actor, token, character, item, args, scope, workflow}) {
    let reactionEffect = chris.findEffect(workflow.actor, 'Reaction');
    if (reactionEffect) await chris.removeEffect(reactionEffect);
    let effect = chris.findEffect(workflow.actor, 'Summoned Creature');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    origin.actor.setFlag('chris-premades', 'feature.reflexiveResistance', workflow.item.system?.uses?.value)
    await chris.addCondition(origin.actor, 'Reaction');
    let itemToUpdate = origin.actor.items.getName('Reflexive Resistance');
    if (!itemToUpdate) return;
    await itemToUpdate.update({'system.uses.value': workflow.item.system?.uses?.value});
}
async function onActor({speaker, actor, token, character, item, args, scope, workflow}) {
    actor.setFlag('chris-premades', 'feature.reflexiveResistance', workflow.item.system?.uses?.value)
    await chris.addCondition(actor, 'Reaction');
    let spawnedToken = await fromUuid(item.flags['chris-premades']?.feature?.spawnedTokenUuid);
    if (!spawnedToken) return;
    let itemToUpdate = spawnedToken.actor.items.getName('Reflexive Resistance');
    if (!itemToUpdate) return;
    await itemToUpdate.update({'system.uses.value': workflow.item.system?.uses?.value});
}
export let summonDrakeCompanion = {
    'item': item,
    'longRest': longRest,
    'onSummon': onSummon,
    'onActor': onActor,
}