import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Healing Spirit');
    if (!sourceActor) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Healing Spirit - Heal', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Healing Spirit - Heal');
    featureData.system.damage.parts[0][0] = (workflow.castData.castLevel - 1) + 'd6[healing]';
    let uses = Math.max(2, chris.getSpellMod(workflow.item) + 1);
    featureData.system.uses.max = uses;
    featureData.system.uses.value = uses;
    setProperty(featureData, 'flags.chris-premades.spell.healingSpirit.name', workflow.item.name);
    async function effectMacro() {
        let originActor = origin.actor;
        await warpgate.dismiss(token.id);
        let castEffect = chrisPremades.helpers.findEffect(originActor, origin.name);
        if (castEffect) await chrisPremades.helpers.removeEffect(castEffect);
    }
    let effectData = {
        'name': workflow.item.name,
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
                    'button': featureData.name
                }
            }
        }
    };
    let updates = {
        'actor': {
            'name': workflow.item.name,
            'prototypeToken': {
                'name': workflow.item.name
            }
        },
        'token': {
            'name': workflow.item.name
        },
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
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
    let options = {
        'controllingActor': workflow.token.actor
    };
    let tokenDocument = await sourceActor.getTokenDocument();
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let targetEffect = chris.findEffect(spawnedToken.actor, workflow.item.name);
    if (!targetEffect) return;
    let casterEffectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'let effect = await fromUuid("' + targetEffect.uuid + '"); if (effect) await chrisPremades.helpers.removeEffect(effect); await warpgate.revert(token.document, "Healing Spirit");'
                }
            },
            'chris-premades': {
                'vae': {
                    'button': 'Healing Spirit - Move'
                }
            }
        }
    };
    let moveFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Healing Spirit - Move', false);
    if (!moveFeatureData) return;
    moveFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Healing Spirit - Move');
    let updates2 = {
        'embedded': {
            'Item': {
                [moveFeatureData.name]: moveFeatureData
            },
            'ActiveEffect': {
                [casterEffectData.name]: casterEffectData
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Healing Spirit',
        'description': 'Healing Spirit'
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
    await MidiQOL.getConcentrationEffect(workflow.actor, workflow.item).addDependents([workflow.actor.effects.getName(casterEffectData.name)]);
    let command = 'await chrisPremades.macros.healingSpirit.template(template, token);';
    let templateData = {
        'angle': 0,
        'direction': 45,
        'distance': 7.071,
        'x': spawnedToken.x,
        'y': spawnedToken.y,
        't': 'rect',
        'user': game.user,
        'fillColor': game.user.color,
        'flags': {
            'templatemacro': {
                'whenEntered': {
                    'asGM': false,
                    'command': command
                },
                'whenThrough': {
                    'asGM': false,
                    'command': command
                },
                'whenTurnStart': {
                    'asGM': false,
                    'command': command
                }
            },
            'dnd5e': {
                'origin': workflow.item.uuid
            },
            'midi-qol': {
                'originUuid': workflow.item.uuid
            },
            'chris-premades': {
                'spell': {
                    'healingSpirit': {
                        'origin': spawnedToken.uuid,
                        'touchedTokens': {}
                    }
                }
            }
        }
    };
    let template = await chris.createTemplate(templateData);
    await warpgate.wait(200);
    await tokenAttacher.attachElementsToToken([template], spawnedToken.object, false);
}
async function template(template, token) {
    let sourceToken = await fromUuid(template.flags['chris-premades'].spell.healingSpirit.origin);
    if (!sourceToken) return;
    let sourceDisposition = sourceToken.disposition;
    if (token.document.disposition != sourceDisposition) return;
    let touchedTokens = template.flags['chris-premades'].spell.healingSpirit.touchedTokens;
    if (chris.inCombat()) {
        let tokenTurn = touchedTokens[token.id];
        let currentTurn = game.combat.round + '-' + game.combat.turn;
        if (tokenTurn === currentTurn) return;
    }
    let selection = await chris.dialog('Healing Spirit: Apply healing?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    let feature = sourceToken.actor.items.getName('Healing Spirit - Heal');
    if (!feature) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
    if (chris.inCombat()) {
        touchedTokens[token.id] = game.combat.round + '-' + game.combat.turn;
        await template.setFlag('chris-premades', 'spell.healingSpirit.touchedTokens', touchedTokens);
    }
}
async function healing({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.system.uses.value != 0) return;
    let effectName = workflow.item.flags['chris-premades']?.spell?.healingSpirit?.name;
    if (!effectName) return;
    let effect = chris.findEffect(workflow.actor, effectName);
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let healingSpirit = {
    'item': item,
    'template': template,
    'healing': healing
};