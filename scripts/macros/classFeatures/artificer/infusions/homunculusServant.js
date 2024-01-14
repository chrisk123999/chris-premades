import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Homunculus Servant');
    if (!sourceActor) return;
    let mendingData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Mending', false);
    if (!mendingData) return;
    mendingData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Mending');
    let forceStrikeData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Force Strike', false);
    if (!forceStrikeData) return;
    forceStrikeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Force Strike');
    let channelMagicData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Channel Magic', false);
    if (!channelMagicData) return;
    channelMagicData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Channel Magic');
    let evasionData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Evasion', false);
    if (!evasionData) return;
    evasionData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Evasion');
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let artificerLevel = workflow.actor.classes?.artificer?.system?.levels;
    if (!artificerLevel) return;
    let hpFormula = artificerLevel + ' + ' + (1 + chris.getSpellMod(workflow.item));
    let hpValue = await new Roll(hpFormula).evaluate({async: true});
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Homunculus Servant';
    if (name === '') name = 'Homunculus Servant';
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
                        'max': hpValue.total,
                        'value': hpValue.total
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
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + meleeAttackBonus.total,
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + rangedAttackBonus.total
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
                [mendingData.name]: mendingData,
                [forceStrikeData.name]: forceStrikeData,
                [channelMagicData.name]: channelMagicData,
                [evasionData.name]: evasionData,
                [dodgeData.name]: dodgeData,
            }
        }
    };
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    if (avatarImg) updates.actor.img = avatarImg;
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? 'earth';
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    let homunculusToken = await tashaSummon.spawn(sourceActor, updates, 86400, workflow.item, 120, workflow.token, animation);
    if (!homunculusToken) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Homunculus Servant - Command', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Homunculus Servant - Command');
    let channelMagicCasterData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Channel Magic (Caster)', false);
    if (!channelMagicCasterData) return;
    channelMagicCasterData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Channel Magic (Caster)');
    channelMagicCasterData.name = 'Channel Magic'
    let updates2 = {
        'embedded': {
            'Item': {
                [channelMagicCasterData.name]: channelMagicCasterData,
                [featureData.name]: featureData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Homunculus Servant',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "Homunculus Servant");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                },
                'feature': {
                    'homunculusServant': homunculusToken.id
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}
async function attackApply({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = workflow.actor.effects.find((e) => e?.flags['chris-premades']?.feature?.homunculusServant);
    if (!effect) return;
    let homunculusId = effect.flags['chris-premades']?.feature?.homunculusServant;
    if (!homunculusId) return;
    let homunculusToken = canvas.scene.tokens.get(homunculusId);
    if (!homunculusToken) return;
    if (chris.getDistance(workflow.token, homunculusToken) > 120) {
        ui.notifications.info('Homunculus Too Far Away!');
        return;
    }
    let effectData = {
        'name': 'Channel Magic',
        'icon': workflow.item.img,
        'origin': effect.origin.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.rangeOverride.attack.all',
                'mode': 0,
                'value': 1,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'priority': 20,
                'value': 'function.chrisPremades.macros.homunculusServant.attackEarly,preambleComplete'
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    '1Attack'
                ],
                'stackable': 'none',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(workflow.actor, effectData);
    await chris.createEffect(homunculusToken.actor, effectData);
}
async function attackEarly({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell' || workflow.item.system.range.units != 'touch') {
        ui.notifications.info('Invalid Spell Type!');
        return false;
    }
    let effect = workflow.actor.effects.find((e) => e?.flags['chris-premades']?.feature?.homunculusServant);
    if (!effect) return;
    let homunculusId = effect.flags['chris-premades']?.feature?.homunculusServant;
    if (!homunculusId) return;
    let homunculusToken = canvas.scene.tokens.get(homunculusId);
    if (!homunculusToken) return;
    await chris.addCondition(homunculusToken.actor, 'Reaction');
}
export let homunculusServant = {
    'item': item,
    'attackApply': attackApply,
    'attackEarly': attackEarly
}