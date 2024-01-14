import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonFey({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Fuming', 'Fuming'], ['Mirthful', 'Mirthful'], ['Tricksy', 'Tricksy']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Fey Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Fey Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Fey Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let feyStepData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Fey Step (Fey Spirit)', false);
    if (!feyStepData) return;
    feyStepData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fey Step (Fey Spirit)');
    feyStepData.name = 'Fey Step';
    let shortSwordData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Shortsword (Fey Spirit)', false);
    if (!shortSwordData) return;
    shortSwordData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shortsword (Fey Spirit)');
    shortSwordData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
    shortSwordData.name = 'Shortsword';
    let hpFormula = 30 + ((workflow.castData.castLevel - 3) * 10);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Fey Spirit (' + selection + ')';
    if (name === '') name = 'Fey Spirit (' + selection + ')';
    let meleeAttackBonus = await new Roll(workflow.actor.system.bonuses.msak.attack + ' + 0').roll({async: true});
    let rangedAttackBonus = await new Roll(workflow.actor.system.bonuses.rsak.attack + ' + 0').roll({async: true});
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
                        'flat': 12 + workflow.castData.castLevel
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
                [feyStepData.name]: feyStepData,
                [shortSwordData.name]: shortSwordData
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
            mirthfulData.system.save.dc = chris.getSpellDC(workflow.item);
            updates.embedded.Item[mirthfulData.name] = mirthfulData;
            break;
        case 'Tricksy':
            let tricksyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Tricksy', false);
            if (!tricksyData) return;
            tricksyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Tricksy');
            updates.embedded.Item[tricksyData.name] = tricksyData;
            break;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? 'nature';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 90, workflow.token, animation);
}