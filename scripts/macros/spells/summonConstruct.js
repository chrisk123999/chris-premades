import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonConstruct({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Clay ', 'Clay'], ['Metal', 'Metal'], ['Stone', 'Stone']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Construct Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Construct Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Construct Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let slamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Slam (Construct Spirit)', false);
    if (!slamData) return;
    slamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Slam (Construct Spirit)');
    slamData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    let hpFormula = 40 + ((this.castData.castLevel - 4) * 15);
    let name = 'Construct Spirit (' + selection + ')';
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
                    'attributes': {
                        'ac': {
                            'flat': 13 + this.castData.castLevel
                        }
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
                [slamData.name]: slamData,
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
        case 'Clay':
            let beserkLashingData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Berserk Lashing (Clay Only)', false);
            if (!beserkLashingData) return;
            beserkLashingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Berserk Lashing (Clay Only)');
            updates.embedded.Item[beserkLashingData.name] = beserkLashingData;
            break;
        case 'Metal':
            let heatedBodyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Heated Body (Metal Only)', false);
            if (!heatedBodyData) return;
            heatedBodyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Heated Body (Metal Only)');
            updates.embedded.Item[heatedBodyData.name] = heatedBodyData;
            break;
        case 'Stone':
            let stoneLethargyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Stone Lethargy (Stone Only)', false);
            if (!stoneLethargyData) return;
            stoneLethargyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Stone Lethargy (Stone Only)');
            stoneLethargyData.system.save.dc = chris.getSpellDC(this.item);
            updates.embedded.Item[stoneLethargyData.name] = stoneLethargyData;
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}