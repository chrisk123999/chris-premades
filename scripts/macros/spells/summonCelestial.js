import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonCelestial({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Avenger ', 'Avenger'], ['Defender', 'Defender']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Celestial Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Celestial Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Celestial Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let healingTouchData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Healing Touch (Celestial Spirit)', false);
    if (!healingTouchData) return;
    healingTouchData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Healing Touch (Celestial Spirit)');
    healingTouchData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
    let hpFormula = 40 + ((workflow.castData.castLevel - 5) * 10);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Celestial Spirit (' + selection + ')';
    if (name === '') name = 'Celestial Spirit (' + selection + ')';
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
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.wis.mod + Number(workflow.actor.system.bonuses.rsak.attack)
                        }
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
                [healingTouchData.name]: healingTouchData
            }
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar-' + selection);
    let tokenImg = chris.getConfiguration(workflow.item, 'token-' + selection);
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
            radiantBowData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            updates.embedded.Item[radiantBowData.name] = radiantBowData;
            updates.actor.system.attributes.ac = {
                'flat': 11 + workflow.castData.castLevel
            }
            break;
        case 'Defender':
            let radiantMaceData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Radiant Mace (Defender Only)', false);
            if (!radiantMaceData) return;
            radiantMaceData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Radiant Mace (Defender Only)');
            radiantMaceData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            updates.embedded.Item[radiantMaceData.name] = radiantMaceData;
            updates.actor.system.attributes.ac = {
                'flat': 11 + workflow.castData.castLevel + 2
            }
            break;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? 'celestial';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 90, workflow.token, animation);
}