import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonAberration({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Beholderkin', 'Beholderkin'], ['Slaad', 'Slaad'], ['Star Spawn', 'Star Spawn']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Aberrant Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Aberrant Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Aberrant Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let hpFormula = 40 + ((this.castData.castLevel - 4) * 10);
    let updates = {
        'actor': {
            'name': 'Aberrant Spirit (' + selection + ')',
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(this.actor.system.attributes.prof)
                },
                'attributes': {
                    'ac': {
                        'flat': 11 + this.castData.castLevel
                    },
                    'hp': {
                        'formula': hpFormula,
                        'max': hpFormula,
                        'value': hpFormula
                    }
                }
            },
            'flags': {
                'chris-premades': {
                    'tashaSummon': {
                        'scaling': this.item.system.save.scaling
                    }
                }
            }
        },
        'token': {
            'name': 'Aberrant Spirit (' + selection + ')'
        },
        'embedded': {
            'Item': {
                [multiAttackFeatureData.name]: multiAttackFeatureData
            }
        }
    };
    switch (selection) {
        case 'Beholderkin':
            let eyeRayData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Eye Ray (Beholderkin Only)', false);
            if (!eyeRayData) return;
            eyeRayData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Eye Ray (Beholderkin Only)');
            eyeRayData.system.attackBonus = chris.getSpellMod(this.item) - sourceActor.system.abilities.int.mod + Number(this.actor.system.bonuses.rsak.attack);
            eyeRayData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
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
            clawsData.system.attackBonus = chris.getSpellMod(this.item) - sourceActor.system.abilities.int.mod + Number(this.actor.system.bonuses.msak.attack);
            clawsData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
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
            slamData.system.attackBonus = chris.getSpellMod(this.item) - sourceActor.system.abilities.int.mod + Number(this.actor.system.bonuses.msak.attack);
            slamData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
            updates.embedded.Item[slamData.name] = slamData;
            let auraData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Whispering Aura (Star Spawn Only)', false);
            if (!auraData) return;
            auraData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Whispering Aura (Star Spawn Only)');
            auraData.system.save.dc = chris.getSpellDC(this.item);
            updates.embedded.Item[auraData.name] = auraData;
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}