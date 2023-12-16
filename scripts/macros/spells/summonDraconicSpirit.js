import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonDraconicSpirit({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog('What dragon type?', [['Chromatic ', 'Chromatic'], ['Metallic', 'Metallic'], ['Gem', 'Gem']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Draconic Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Draconic Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Draconic Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let rendData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Rend (Draconic Spirit)', false);
    if (!rendData) return;
    rendData.name = 'Rend';
    rendData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rend (Draconic Spirit)');
    rendData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
    let breathData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Breath Weapon', false);
    if (!breathData) return;
    breathData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Breath Weapon');
    breathData.system.save.dc = chris.getSpellDC(workflow.item);
    let hpFormula = 50 + ((workflow.castData.castLevel - 5) * 10);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Draconic Spirit (' + selection + ')';
    if (name === '') name = 'Draconic Spirit (' + selection + ')';
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
                        'flat': 14 + workflow.castData.castLevel
                    }
                }
            },
            'prototypeToken': {
                'name': name,
                'disposition': workflow.token.document.disposition
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + Number(workflow.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + Number(workflow.actor.system.bonuses.rsak.attack)
                        }
                    },
                    'draconicSpirit': {
                        'type': selection
                    }
                }
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        },
        'embedded': {
            'Item': {
                [multiAttackFeatureData.name]: multiAttackFeatureData,
                [rendData.name]: rendData,
                [breathData.name]: breathData
            }
        }
    };
    switch (selection) {
        case 'Chromatic':
        case 'Metallic':
            updates.actor.system.traits = {
                'dr': {
                    'value': [
                        'acid',
                        'cold',
                        'fire',
                        'lightning',
                        'poison'
                    ]
                }
            }
        break;
        case 'Gem': {
            updates.actor.system.traits = {
                'dr': {
                    'value': [
                        'force',
                        'necrotic',
                        'psychic',
                        'radiant',
                        'thunder'
                    ]
                }
            }
        }
    }
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar-' + selection);
    let tokenImg = chris.getConfiguration(workflow.item, 'token-' + selection);
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? 'fire';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 60, workflow.token, animation);
    let options;
    switch (selection) {
        case 'Chromatic':
        case 'Metallic':
            options = [['Acid', 'acid'], ['Cold', 'cold'], ['Fire', 'fire'], ['Lightning', 'lightning'], ['Poison', 'poison']];
            break;
        case 'Gem':
            options = [['Force', 'force'], ['Necrotic', 'necrotic'], ['Psychic', 'psychic'], ['Radiant', 'radiant'], ['Thunder', 'thunder']];
            break;
    }
    let selection2 = await chris.dialog('Shared Resistances: What damage type?', options);
    if (!selection2) return;
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let effectUpdates = {
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'priority': 20,
                'value': selection2
            }
        ]
    }
    await chris.updateEffect(effect, effectUpdates);
}