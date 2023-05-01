import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonShadowspawn({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Fury', 'Fury'], ['Despair', 'Despair'], ['Fear', 'Fear']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Shadow Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Shadow Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Shadow Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let chillingRendData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Chilling Rend', false);
    if (!chillingRendData) return;
    chillingRendData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Chilling Rend');
    chillingRendData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    let dreadfulScreamData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Dreadful Scream', false);
    if (!dreadfulScreamData) return;
    dreadfulScreamData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dreadful Scream');
    dreadfulScreamData.system.save.dc = chris.getSpellDC(this.item);
    let hpFormula = 35 + ((this.castData.castLevel - 3) * 15);
    let name = 'Shadow Spirit (' + selection + ')';
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
                    'ac': {
                        'flat': 11 + this.castData.castLevel
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
                            'melee': chris.getSpellMod(this.item) - sourceActor.system.abilities.dex.mod + Number(this.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(this.item) - sourceActor.system.abilities.dex.mod + Number(this.actor.system.bonuses.rsak.attack)
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
                [chillingRendData.name]: chillingRendData,
                [dreadfulScreamData.name]: dreadfulScreamData,
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
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}