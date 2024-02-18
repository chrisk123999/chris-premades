import {tashaSummon} from '../../../../utility/tashaSummon.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let selection = await chris.dialog('What companion type?', [['Land', 'Land'], ['Sea', 'Sea'], ['Sky', 'Sky']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Primal Companion');
    if (!sourceActor) return;
    let rangerLevel = workflow.actor.classes?.ranger?.system?.levels;
    if (!rangerLevel) return;
    let primalBondData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Primal Bond', false);
    if (!primalBondData) return;
    primalBondData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Primal Bond');
    let commandData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Primal Companion - Command', false);
    if (!commandData) return;
    commandData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Primal Companion - Command');
    let dodgeData = await chris.getItemFromCompendium('chris-premades.CPR Actions', 'Dodge', false);
    if (!dodgeData) return;
    dodgeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dodge');
    let hpFormula = 5 + (rangerLevel * 5);
    let name = chris.getConfiguration(workflow.item, 'name-' + selection) ?? 'Beast of the ' + selection;
    if (name === '') name = 'Beast of the ' + selection;
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
                        'flat': 14 + workflow.actor.system.attributes.prof
                    }
                },
                'traits': {
                    'languages': workflow.actor.system?.traits?.languages
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
                            'melee': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.wis.mod + meleeAttackBonus.total,
                            'ranged': chris.getSpellMod(workflow.item) - sourceActor.system.abilities.wis.mod + rangedAttackBonus.total
                        }
                    }
                }
            }
        },
        'embedded': {
            'Item': {
                [primalBondData.name]: primalBondData,
                [dodgeData.name]: dodgeData
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        }
    }
    let updates2 = {};
    switch (selection) {
        case 'Land':
            let chargeData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Charge', false);
            if (!chargeData) return;
            chargeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Charge');
            chargeData.system.save.dc = chris.getSpellDC(workflow.item);
            let maulData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Maul', false);
            if (!maulData) return;
            maulData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maul');
            updates2 = {
                'actor': {
                    'system': {
                        'attributes': {
                            'movement': {
                                'walk': '40',
                                'climb': '40'
                            }
                        }
                    }
                },
                'embedded': {
                    'Item': {
                        [chargeData.name]: chargeData,
                        [maulData.name]: maulData
                    }
                }
            }
            if (rangerLevel >= 7) {
                updates2.embedded.Item[chargeData.name].flags.midiProperties.magicdam = true,
                updates2.embedded.Item[maulData.name].flags.midiProperties.magicdam = true
            }
        break;
        case 'Sea':
            let amphibiousData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Amphibious', false);
            if (!amphibiousData) return;
            amphibiousData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Amphibious');
            let bindingStrikeData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Binding Strike', false);
            if (!bindingStrikeData) return;
            bindingStrikeData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Binding Strike');
            updates2 = {
                'actor': {
                    'system': {
                        'attributes': {
                            'movement': {
                                'walk': '5',
                                'swim': '60'
                            }
                        }
                    }
                },
                'embedded': {
                    'Item': {
                        [amphibiousData.name]: amphibiousData,
                        [bindingStrikeData.name]: bindingStrikeData
                    }
                }
            };
            if (rangerLevel >= 7) {
                updates2.embedded.Item[bindingStrikeData.name].flags.midiProperties.magicdam = true
            }
        break;
        case 'Sky':
            hpFormula = 4 + 4 * rangerLevel;
            let flybyData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Flyby', false);
            if (!flybyData) return;
            flybyData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Flyby');
            let shredData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Shred', false);
            if (!shredData) return;
            shredData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Shred');
            updates2 = {
                'actor': {
                    'system': {
                        'abilities': {
                            'str': {
                                'value': 6
                            },
                            'dex': {
                                'value': 16
                            },
                            'con': {
                                'value': 13
                            }
                        },
                        'attributes': {
                            'hp': {
                                'formula': hpFormula,
                                'max': hpFormula,
                                'value': hpFormula
                            },
                            'movement': {
                                'walk': '10',
                                'fly': '60'
                            }
                        },
                        'traits': {
                            'size': 'sm'
                        }
                    }
                },
                'token': {
                    'texture': {
                        'scaleX': 0.8,
                        'scaleY': 0.8
                    }
                },
                'embedded': {
                    'Item': {
                        [flybyData.name]: flybyData,
                        [shredData.name]: shredData
                    }
                }
            };
            if (rangerLevel >= 7) {
                updates2.embedded.Item[shredData.name].flags.midiProperties.magicdam = true
            }
        break;
    }
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar-' + selection);
    let tokenImg = chris.getConfiguration(workflow.item, 'token-' + selection);
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    updates = mergeObject(updates, updates2, {'recursive': true});
    let defaultAnimations = {
        'Sky': 'air',
        'Land': 'earth',
        'Sea': 'water'
    };
    let animation = chris.getConfiguration(workflow.item, 'animation-' + selection) ?? defaultAnimations[selection];
    if (chris.jb2aCheck() != 'patreon' || !chris.aseCheck()) animation = 'none';
    await tashaSummon.spawn(sourceActor, updates, 86400, workflow.item, 30, workflow.token, animation);
    let updates3 = {
        'embedded': {
            'Item': {
                [commandData.name]: commandData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Primal Companion',
        'description': commandData.name
    };
    await warpgate.mutate(workflow.token.document, updates3, {}, options);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    let currentScript = effect.flags.effectmacro?.onDelete?.script;
    if (!currentScript) return;
    let effectUpdates = {
        'flags': {
            'effectmacro': {
                'onDelete': { 
                    'script': currentScript + ' await warpgate.revert(token.document, "Primal Companion");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': commandData.name
                }
            }
        }
    };
    await chris.updateEffect(effect, effectUpdates); 
}
async function bindingStrike({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'bindingStrike', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Piercing', 'piercing'], ['Bludgeoning', 'bludgeoning']]);
    if (!selection) selection = 'piercing';
    let damageFormula = workflow.damageRolls[0]._formula.replace('none', selection);
    let damageRoll = await chris.damageRoll(workflow, damageFormula, {}, true);
    workflow.damageRolls[0] = damageRoll;
    await workflow.setDamageRolls(workflow.damageRolls);
    queue.remove(workflow.item.uuid);
}
export let primalCompanion = {
    'item': item,
    'bindingStrike': bindingStrike,
}