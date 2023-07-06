import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonAberration({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Beholderkin', 'Beholderkin'], ['Slaad', 'Slaad'], ['Star Spawn', 'Star Spawn']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Aberrant Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Aberrant Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Aberrant Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let hpFormula = 40 + ((workflow.castData.castLevel - 4) * 10);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Aberrant Spirit (' + selection + ')';
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
                    },
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
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + Number(workflow.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + Number(workflow.actor.system.bonuses.rsak.attack)
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
                [multiAttackFeatureData.name]: multiAttackFeatureData
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
        case 'Beholderkin':
            let eyeRayData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Eye Ray (Beholderkin Only)', false);
            if (!eyeRayData) return;
            eyeRayData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Eye Ray (Beholderkin Only)');
            eyeRayData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            updates.embedded.Item[eyeRayData.name] = eyeRayData;
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'fly': 30,
                'hover': true
            };
            break;
        case 'Slaad':
            let clawsData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Claws (Slaad Only)', false);
            if (!clawsData) return;
            clawsData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Claws (Slaad Only)');
            clawsData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            updates.embedded.Item[clawsData.name] = clawsData;
            let regenerationData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Regeneration (Slaad Only)', false);
            if (!regenerationData) return;
            regenerationData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Regeneration (Slaad Only)');
            updates.embedded.Item[regenerationData.name] = regenerationData;
            break;
        case 'Star Spawn':
            let slamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Psychic Slam (Star Spawn Only)', false);
            if (!slamData) return;
            slamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Psychic Slam (Star Spawn Only)');
            slamData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            updates.embedded.Item[slamData.name] = slamData;
            let auraData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Whispering Aura (Star Spawn Only)', false);
            if (!auraData) return;
            auraData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Whispering Aura (Star Spawn Only)');
            auraData.system.save.dc = chris.getSpellDC(workflow.item);
            updates.embedded.Item[auraData.name] = auraData;
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item);
}