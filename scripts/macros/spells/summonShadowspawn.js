import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonShadowspawn({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Fury', 'Fury'], ['Despair', 'Despair'], ['Fear', 'Fear']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Shadow Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Shadow Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Shadow Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let chillingRendData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Chilling Rend', false);
    if (!chillingRendData) return;
    chillingRendData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Chilling Rend');
    chillingRendData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
    let dreadfulScreamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Dreadful Scream', false);
    if (!dreadfulScreamData) return;
    dreadfulScreamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dreadful Scream');
    dreadfulScreamData.system.save.dc = chris.getSpellDC(workflow.item);
    let hpFormula = 35 + ((workflow.castData.castLevel - 3) * 15);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Shadow Spirit (' + selection + ')';
    if (name === '') name = 'Shadow Spirit (' + selection + ')';
    let meleeAttackBonus = await new Roll(workflow.actor.system.bonuses.msak.attack + ' + 0', workflow.actor.getRollData()).roll({'async': true});
    let rangedAttackBonus = await new Roll(workflow.actor.system.bonuses.rsak.attack + ' + 0', workflow.actor.getRollData()).roll({'async': true});
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
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.dex.mod + meleeAttackBonus.total,
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.dex.mod + rangedAttackBonus.total
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
                [chillingRendData.name]: chillingRendData,
                [dreadfulScreamData.name]: dreadfulScreamData
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
        case 'Fury':
            let terrorFrenzyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Terror Frenzy (Fury Only)', false);
            if (!terrorFrenzyData) return;
            terrorFrenzyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Terror Frenzy (Fury Only)');
            updates.embedded.Item[terrorFrenzyData.name] = terrorFrenzyData;
            break;
        case 'Despair':
            let weightOfSorrowData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Weight of Sorrow (Despair Only)', false);
            if (!weightOfSorrowData) return;
            weightOfSorrowData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Weight of Sorrow (Despair Only)');
            updates.embedded.Item[weightOfSorrowData.name] = weightOfSorrowData;
            break;
        case 'Fear':
            let shadowStealthData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Shadow Stealth (Fear Only)', false);
            if (!shadowStealthData) return;
            shadowStealthData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shadow Stealth (Fear Only)');
            updates.embedded.Item[shadowStealthData.name] = shadowStealthData;
            break;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? 'shadow';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 90, workflow.token, animation);
}