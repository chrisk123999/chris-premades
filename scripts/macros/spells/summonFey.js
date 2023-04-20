import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonFey({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Fuming', 'Fuming'], ['Mirthful', 'Mirthful'], ['Tricksy', 'Tricksy']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Fey Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Fey Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Fey Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let feyStepData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Fey Step (Fey Spirit)', false);
    if (!feyStepData) return;
    feyStepData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fey Step (Fey Spirit)');
    feyStepData.name = 'Fey Step';
    let shortSwordData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Shortsword (Fey Spirit)', false);
    if (!shortSwordData) return;
    shortSwordData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shortsword (Fey Spirit)');
    shortSwordData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
    shortSwordData.name = 'Shortsword';
    let hpFormula = 30 + ((this.castData.castLevel - 3) * 10);
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
                    },
                    'ac': {
                        'flat': 12 + this.castData.castLevel
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
                [feyStepData.name]: feyStepData,
                [shortSwordData.name]: shortSwordData,
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
        case 'Fuming':
            let fumingData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Fuming', false);
            if (!fumingData) return;
            fumingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fuming');
            updates.embedded.Item[fumingData.name] = fumingData;
            updates.embedded.Item[feyStepData.name].flags['midi-qol'] = {
                'effectActivation': false,
                'onUseMacroName': '[postActiveEffects]function.chrisPremades.macros.monster.feySpirit.fuming',
                'onUseMacroParts': {
                    'items': [
                        {
                            'macroName': 'function.chrisPremades.macros.monster.feySpirit.fuming',
                            'option': 'postActiveEffects'
                        }
                    ]
                }
            };
            break;
        case 'Mirthful':
            let mirthfulData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Mirthful', false);
            if (!mirthfulData) return;
            mirthfulData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mirthful');
            updates.embedded.Item[mirthfulData.name] = mirthfulData;
            break;
        case 'Tricksy':
            let tricksyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Tricksy', false);
            if (!tricksyData) return;
            tricksyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Tricksy');
            updates.embedded.Item[tricksyData.name] = tricksyData;
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}