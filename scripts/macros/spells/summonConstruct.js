import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonConstruct({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Clay ', 'Clay'], ['Metal', 'Metal'], ['Stone', 'Stone']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Construct Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Construct Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Construct Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let slamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Slam (Construct Spirit)', false);
    if (!slamData) return;
    slamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Slam (Construct Spirit)');
    slamData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
    let hpFormula = 40 + ((workflow.castData.castLevel - 4) * 15);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Construct Spirit (' + selection + ')';
    if (name === '') name = 'Construct Spirit (' + selection + ')';
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
                    'hp': {
                        'formula': hpFormula,
                        'max': hpFormula,
                        'value': hpFormula
                    },
                    'ac': {
                        'flat': 13 + workflow.castData.castLevel
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
                [slamData.name]: slamData
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
            stoneLethargyData.system.save.dc = chris.getSpellDC(workflow.item);
            updates.embedded.Item[stoneLethargyData.name] = stoneLethargyData;
            break;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? 'earth';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 90, workflow.token, animation);
}