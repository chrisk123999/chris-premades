import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonUndead({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await chris.dialog('What type?', [['Ghostly', 'Ghostly'], ['Putrid', 'Putrid'], ['Skeletal', 'Skeletal']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Undead Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Undead Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Undead Spirit)');
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let hpFormula = 0;
    let damageBonus = 0;
    if (workflow.actor.flags['chris-premades']?.feature?.undeadThralls) {
        let wizardLevels = workflow.actor.classes.wizard?.system?.levels;
        if (wizardLevels) hpFormula += wizardLevels;
        damageBonus = workflow.actor.system.attributes.prof;
    }
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Undead Spirit (' + selection + ')';
    if (name === '') name = 'Undead Spirit (' + selection + ')';
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
        case 'Ghostly':
            hpFormula += 30 + ((workflow.castData.castLevel - 3) * 10);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'fly': 40,
                'hover': true
            };
            let incorporealPassageData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Incorporeal Passage (Ghostly Only)', false);
            if (!incorporealPassageData) return;
            incorporealPassageData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Incorporeal Passage (Ghostly Only)');
            updates.embedded.Item[incorporealPassageData.name] = incorporealPassageData;
            let deathlyTouchData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Deathly Touch (Ghostly Only)', false);
            if (!deathlyTouchData) return;
            deathlyTouchData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Deathly Touch (Ghostly Only)');
            deathlyTouchData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            deathlyTouchData.system.save.dc = chris.getSpellDC(workflow.item);
            if (damageBonus) deathlyTouchData.system.damage.parts[0][0] += ' + ' + damageBonus;
            updates.embedded.Item[deathlyTouchData.name] = deathlyTouchData;
            break;
        case 'Putrid':
            hpFormula += 30 + ((workflow.castData.castLevel - 3) * 10);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            let festeringAuraData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Festering Aura (Putrid Only)', false);
            if (!festeringAuraData) return;
            festeringAuraData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Festering Aura (Putrid Only)');
            festeringAuraData.system.save.dc = chris.getSpellDC(workflow.item);
            updates.embedded.Item[festeringAuraData.name] = festeringAuraData;
            let rottingClawData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Rotting Claw (Putrid Only)', false);
            if (!rottingClawData) return;
            rottingClawData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rotting Claw (Putrid Only)');
            rottingClawData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            if (damageBonus) rottingClawData.system.damage.parts[0][0] += ' + ' + damageBonus;
            setProperty(rottingClawData, 'flags.chris-premades.feature.rottingClaw.dc', chris.getSpellDC(workflow.item));
            updates.embedded.Item[rottingClawData.name] = rottingClawData;
            break;
        case 'Skeletal':
            hpFormula += 20 + ((workflow.castData.castLevel - 3) * 10);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            let graveBoltData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Grave Bolt (Skeletal Only)', false);
            if (!graveBoltData) return;
            graveBoltData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Grave Bolt (Skeletal Only)');
            graveBoltData.system.damage.parts[0][0] += ' + ' + workflow.castData.castLevel;
            if (damageBonus) graveBoltData.system.damage.parts[0][0] += ' + ' + damageBonus;
            updates.embedded.Item[graveBoltData.name] = graveBoltData;
            break;
    }
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? 'shadow';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 3600, workflow.item, 90, workflow.token, animation);
}