import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonDraconicSpirit({speaker, actor, token, character, item, args}) {
    let selection = await chris.dialog('What dragon type?', [['Chromatic ', 'Chromatic'], ['Metallic', 'Metallic'], ['Gem', 'Gem']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Draconic Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Draconic Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Draconic Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let rendData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Rend (Draconic Spirit)', false);
    if (!rendData) return;
    rendData.name = 'Rend';
    rendData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rend (Draconic Spirit)');
    rendData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    let breathData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Breath Weapon', false);
    if (!breathData) return;
    breathData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Breath Weapon');
    breathData.system.save.dc = chris.getSpellDC(this.item);
    let hpFormula = 50 + ((this.castData.castLevel - 5) * 10);
    let name = 'Draconic Spirit (' + selection + ')';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(this.actor.system.attributes.prof)
                },
                'attributes': {
                    'hp': {
                        'formula': hpFormula,
                        'max': hpFormula,
                        'value': hpFormula
                    },
                    'ac': {
                        'flat': 14 + this.castData.castLevel
                    }
                }
            },
            'prototypeToken': {
                'name': name
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(this.item) - sourceActor.system.abilities.str.mod + Number(this.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(this.item) - sourceActor.system.abilities.str.mod + Number(this.actor.system.bonuses.rsak.attack)
                        }
                    },
                    'draconicSpirit': {
                        'type': selection
                    }
                }
            }
        },
        'token': {
            'name': name
        },
        'embedded': {
            'Item': {
                [multiAttackFeatureData.name]: multiAttackFeatureData,
                [rendData.name]: rendData,
                [breathData.name]: breathData,
                'Configure Images': warpgate.CONST.DELETE
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
    let avatarImg = sourceActor.flags['chris-premades']?.summon?.image?.[selection]?.avatar;
    let tokenImg = sourceActor.flags['chris-premades']?.summon?.image?.[selection]?.token;
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
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
    let effect = chris.findEffect(this.actor, this.item.name);
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