import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonElemental({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Air ', 'Air'], ['Earth', 'Earth'], ['Fire', 'Fire'], ['Water', 'Water']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Elemental Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Elemental Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Elemental Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let slamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Slam (Elemental Spirit)', false);
    if (!slamData) return;
    slamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Slam (Elemental Spirit)');
    slamData.system.attackBonus = chris.getSpellMod(this.item) - sourceActor.system.abilities.str.mod + Number(this.actor.system.bonuses.msak.attack);
    slamData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    let hpFormula = 50 + ((this.castData.castLevel - 4) * 10);
    let name = 'Elemental Spirit (' + selection + ')';
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
        case 'Air':
            let amorphousFormData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Amorphous Form (Air, Fire, and Water Only)', false);
            if (!amorphousFormData) return;
            amorphousFormData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Amorphous Form (Air, Fire, and Water Only)');
            updates.embedded.Item[amorphousFormData.name] = amorphousFormData;
            updates.actor.system.attributes.movement = {
                'walk': 40,
                'fly': 40,
                'hover': true
            };
            setProperty(updates, 'actor.system.traits.dr.value', ['lightning', 'thunder']);
            break;
        case 'Earth':
            updates.actor.system.attributes.movement = {
                'walk': 40,
                'burrow': 40
            };
            setProperty(updates, 'actor.system.traits.dr.value', ['slashing', 'piercing']);
            break;
        case 'Fire':
            let amorphousFormData2 = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Amorphous Form (Air, Fire, and Water Only)', false);
            if (!amorphousFormData2) return;
            amorphousFormData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Amorphous Form (Air, Fire, and Water Only)');
            updates.embedded.Item[amorphousFormData2.name] = amorphousFormData2;
            setProperty(updates, 'actor.system.traits.di.value', ['fire', 'poison']);
            let damageString = updates.embedded.Item[slamData.name].system.damage.parts[0][0];
            updates.embedded.Item[slamData.name].system.damage.parts[0][0] = damageString.replace('bludgeoning', 'fire');
            updates.embedded.Item[slamData.name].system.damage.parts[0][1] = 'fire';
            break;
        case 'Water':
            let amorphousFormData3 = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Amorphous Form (Air, Fire, and Water Only)', false);
            if (!amorphousFormData3) return;
            amorphousFormData3.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Amorphous Form (Air, Fire, and Water Only)');
            updates.embedded.Item[amorphousFormData3.name] = amorphousFormData3;
            updates.actor.system.attributes.movement = {
                'walk': 40,
                'swim': 40
            };
            setProperty(updates, 'actor.system.traits.dr.value', ['acid']);
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}