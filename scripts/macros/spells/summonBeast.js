import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonBeast({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Air', 'Air'], ['Land', 'Land'], ['Water', 'Water']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Bestial Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Bestial Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Bestial Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let maulData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Maul (Bestial Spirit)', false);
    if (!maulData) return;
    maulData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maul (Bestial Spirit)');
    maulData.system.attackBonus = chris.getSpellMod(this.item) - sourceActor.system.abilities.str.mod + Number(this.actor.system.bonuses.msak.attack);
    maulData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    let hpFormula;
    let updates = {
        'actor': {
            'name': 'Bestial Spirit (' + selection + ')',
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(this.actor.system.attributes.prof)
                },
                'attributes': {
                    'ac': {
                        'flat': 11 + this.castData.castLevel
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
            'name': 'Bestial Spirit (' + selection + ')'
        },
        'embedded': {
            'Item': {
                [multiAttackFeatureData.name]: multiAttackFeatureData,
                [maulData.name]: maulData
            }
        }
    };
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
            hpFormula = 20 + ((this.castData.castLevel - 2) * 5);
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
            hpFormula = 30 + ((this.castData.castLevel - 2) * 5);
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
            hpFormula = 30 + ((this.castData.castLevel - 2) * 5);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}