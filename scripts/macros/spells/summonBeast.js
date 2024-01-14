import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonBeast({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Air', 'Air'], ['Land', 'Land'], ['Water', 'Water']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Bestial Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Bestial Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Bestial Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let maulData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Maul (Bestial Spirit)', false);
    if (!maulData) return;
    maulData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maul (Bestial Spirit)');
    maulData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
    let hpFormula;
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Bestial Spirit (' + selection + ')';
    if (name === '') name = 'Bestial Spirit (' + selection + ')';
    let meleeAttackBonus = await new Roll(workflow.actor.system.bonuses.msak.attack + ' + 0', workflow.actor.getRollData()).roll({async: true});
    let rangedAttackBonus = await new Roll(workflow.actor.system.bonuses.rsak.attack + ' + 0', workflow.actor.getRollData()).roll({async: true});
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(workflow.actor.system.attributes.prof)
                },
                'attributes': {
                    'ac': {
                        'flat': 11 + workflow.castData.castLevel
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
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + meleeAttackBonus.total,
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.str.mod + rangedAttackBonus.total
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
                [maulData.name]: maulData
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
        case 'Air':
            let flybyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Flyby (Air Only)', false);
            if (!flybyData) return;
            flybyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Flyby (Air Only)');
            updates.embedded.Item[flybyData.name] = flybyData;
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'fly': 60
            };
            hpFormula = 20 + ((workflow.castData.castLevel - 2) * 5);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            break;
        case 'Land':
            let packTacticsData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Pack Tactics (Land and Water Only)', false);
            if (!packTacticsData) return;
            packTacticsData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Pack Tactics (Land and Water Only)');
            updates.embedded.Item[packTacticsData.name] = packTacticsData;
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'climb': 30
            };
            hpFormula = 30 + ((workflow.castData.castLevel - 2) * 5);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            break;
        case 'Water':
            let packTacticsData2 = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Pack Tactics (Land and Water Only)', false);
            if (!packTacticsData2) return;
            packTacticsData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Pack Tactics (Land and Water Only)');
            updates.embedded.Item[packTacticsData2.name] = packTacticsData2;
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'swim': 30
            };
            hpFormula = 30 + ((workflow.castData.castLevel - 2) * 5);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            break;
    }
    let defaultAnimations = {
        'Air': 'air',
        'Land': 'earth',
        'Water': 'water'
    };
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? defaultAnimations[selection];
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 90, workflow.token, animation);
}