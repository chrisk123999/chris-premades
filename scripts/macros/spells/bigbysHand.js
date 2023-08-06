import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Bigby\'s Hand');
    if (!sourceActor) return;
    let damageScale = ((workflow.castData.castLevel - 5) * 2)
    let clenchedFistData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Clenched Fist', false);
    if (!clenchedFistData) return;
    clenchedFistData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Clenched Fist');
    clenchedFistData.system.damage.parts[0][0] = (4 + damageScale) + 'd8[force]';
    let forcefulHandData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Forceful Hand', false);
    if (!forcefulHandData) return;
    forcefulHandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Forceful Hand');
    forcefulHandData.name = 'Forceful Hand (' + ((chris.getSpellMod(workflow.item) * 5) + 5) + ' feet)';
    let graspingHandData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Grasping Hand', false);
    if (!graspingHandData) return;
    graspingHandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Grasping Hand');
    let interposingHandData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Interposing Hand', false);
    if (!interposingHandData) return;
    interposingHandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Interposing Hand');
    let hpFormula = workflow.actor.system.attributes.hp.max;
    let name = chris.getConfiguration(workflow.item, 'name') ?? 'Bigby\'s Hand';
    if (name === '') name = 'Bigby\'s Hand';
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
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + Number(workflow.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.int.mod + Number(workflow.actor.system.bonuses.rsak.attack)
                        }
                    },
                    'spell': {
                        'damageScale': damageScale,
                        'casterSpellMod': chris.getSpellMod(workflow.item)
                    }
                }
            }
        },
        'token': {
            'name': name
        },
        'embedded': {
            'Item': {
                [clenchedFistData.name]: clenchedFistData,
                [forcefulHandData.name]: forcefulHandData,
                [graspingHandData.name]: graspingHandData,
                [interposingHandData.name]: interposingHandData
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
    await tashaSummon.spawn(sourceActor, updates, 60, workflow.item);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Bigby\'s Hand - Move', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Bigby\'s Hand - Move');
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options);
    let effect = chris.findEffect(workflow.actor, 'Bigby\'s Hand');
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "' + name + '");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates);
}
async function forcefulHand({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let hasAdvantage = (chris.getSize(targetActor) <= (chris.sizeStringValue('medium')));
    await workflow.actor.rollSkill('ath', {advantage: hasAdvantage});
    await targetActor.rollSkill('ath');
}
async function graspingHand({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    if (chris.getSize(targetActor) > chris.sizeStringValue('huge')) {
        ui.notifications.info('Target is too big!');
        return;
    }
    let hasAdvantage = (chris.getSize(targetActor) <=  (chris.sizeStringValue('medium')));
    let sourceRoll = await workflow.actor.rollSkill('ath', {'advantage': hasAdvantage});
    let targetRoll;
    if (targetActor.system.skills.acr.total >= targetActor.system.skills.ath.total) {
        targetRoll = await targetActor.rollSkill('acr');
    }
    else {
        targetRoll = await targetActor.rollSkill('ath');
    }
    if (targetRoll.total > sourceRoll.total) return;
    await chris.addCondition(targetActor, 'Grappled', false, workflow.item.uuid);
    let ghcFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Grasping Hand - Crush', false);
    if (!ghcFeatureData) return;
    let damageScale = workflow.actor.flags['chris-premades']?.spell?.damageScale;
    if (!damageScale === undefined) return;
    let spellMod = workflow.actor.flags['chris-premades']?.spell?.casterSpellMod;
    if (!spellMod) return;
    ghcFeatureData.system.damage.parts[0][0] = (2 + (damageScale)) + 'd6[bludgeoning] + ' + spellMod;
    ghcFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Grasping Hand - Crush');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Grasping Hand - Crush');
    }
    let ghcEffectData = {
        'label': ghcFeatureData.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': ghcFeatureData.name
                }
            }
        }
    };
    let ghcUpdates = {
        'embedded': {
            'Item': {
                [ghcFeatureData.name]: ghcFeatureData
            },
            'ActiveEffect': {
                [ghcFeatureData.name]: ghcEffectData
            }
        }
    };
    let ghcOptions = {
        'permanent': false,
        'name': ghcFeatureData.name,
        'description': ghcFeatureData.name
    };
    await warpgate.mutate(workflow.token.document, ghcUpdates, {}, ghcOptions);
}
async function interposingHandOn({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    let effect = chris.findEffect(workflow.actor, 'Interposing Hand');
    if (!effect) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) return;
    let originActor = origin.actor;
    let originActorUuid = originActor.uuid;
    let targetActor = workflow.targets.first().actor;
    let targetActorUuid = targetActor.uuid;
    if (originActorUuid === targetActorUuid) return;
    await chris.addCondition(targetActor, 'Cover (Half)');
}
async function interposingHandOff({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.disadvantage) return;
    await chris.removeCondition(workflow.targets.first().actor, 'Cover (Half)');
}
export let bigbysHand = {
    'item': item,
    'forcefulHand': forcefulHand,
    'graspingHand': graspingHand,
    'interposingHandOn': interposingHandOn,
    'interposingHandOff': interposingHandOff
}
