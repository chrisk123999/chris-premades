import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonCelestial({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Avenger ', 'Avenger'], ['Defender', 'Defender']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Celestial Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Celestial Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Celestial Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let healingTouchData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Healing Touch (Celestial Spirit)', false);
    if (!healingTouchData) return;
    healingTouchData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Healing Touch (Celestial Spirit)');
    healingTouchData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    let hpFormula = 40 + ((this.castData.castLevel - 5) * 10);
    let name = 'Celestial Spirit (' + selection + ')';
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
                            'ranged': chris.getSpellMod(this.item) - sourceActor.system.abilities.wis.mod + Number(this.actor.system.bonuses.rsak.attack)
                        }
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
                [healingTouchData.name]: healingTouchData,
                'Configure Images': warpgate.CONST.DELETE
            }
        }
    };
    let avatarImg = sourceActor.flags['chris-premades']?.summon?.image?.[selection]?.avatar;
    let tokenImg = sourceActor.flags['chris-premades']?.summon?.image?.[selection]?.token;
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    switch (selection) {
        case 'Avenger':
            let radiantBowData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Radiant Bow (Avenger Only)', false);
            if (!radiantBowData) return;
            radiantBowData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Radiant Bow (Avenger Only)');
            radiantBowData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
            updates.embedded.Item[radiantBowData.name] = radiantBowData;
            updates.actor.system.attributes.ac = {
                'flat': 11 + this.castData.castLevel
            }
            break;
        case 'Defender':
            let radiantMaceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Radiant Mace (Defender Only)', false);
            if (!radiantMaceData) return;
            radiantMaceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Radiant Mace (Defender Only)');
            radiantMaceData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
            updates.embedded.Item[radiantMaceData.name] = radiantMaceData;
            updates.actor.system.attributes.ac = {
                'flat': 11 + this.castData.castLevel + 2
            }
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}