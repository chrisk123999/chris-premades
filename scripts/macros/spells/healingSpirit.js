import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args}) {
    let sourceActor = game.actors.getName('CPR - Healing Spirit');
    if (!sourceActor) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Healing Spirit - Heal', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Healing Spirit - Heal');
    featureData.system.damage.parts[0][0] = (this.castData.castLevel - 1) + 'd6[healing]';
    let uses = Math.max(2, chris.getSpellMod(this.item) + 1);
    featureData.system.uses.max = uses;
    featureData.system.uses.value = uses;
    setProperty(featureData, 'flags.chris-premades.spell.healingSpirit.name', this.item.name);
    async function effectMacro() {
        let originActor = origin.actor;
        await warpgate.dismiss(token.id);
        let castEffect = chrisPremades.helpers.findEffect(originActor, origin.name);
        if (castEffect) await chrisPremades.helpers.removeEffect(castEffect);
    }
    let effectData = {
        'label': this.item.name,
        'icon': this.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': this.item.uuid,
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
            'name': this.item.name,
            'prototypeToken': {
                'name': this.item.name
            }
        },
        'token': {
            'name': this.item.name
        },
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'controllingActor': this.token.actor
    };
    let tokenDocument = await sourceActor.getTokenDocument();
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let targetEffect = chris.findEffect(spawnedToken.actor, this.item.name);
    if (!targetEffect) return;
    let casterEffectData = {
        'label': this.item.name,
        'icon': this.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': this.item.uuid,
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
                [casterEffectData.label]: casterEffectData
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Healing Spirit',
        'description': 'Healing Spirit'
    };
    await warpgate.mutate(this.token.document, updates2, {}, options2);
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
                'origin': this.item.uuid
            },
            'midi-qol': {
                'originUuid': this.item.uuid
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
    let changes = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [templateData]);
    let templateDoc = changes[0];
    await tokenAttacher.attachElementsToToken([templateDoc], spawnedToken.object, false);
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
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': true,
        'consumeSlot': false
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    if (chris.inCombat()) {
        touchedTokens[token.id] = game.combat.round + '-' + game.combat.turn;
        await template.setFlag('chris-premades', 'spell.healingSpirit.touchedTokens', touchedTokens);
    }
}
async function healing({speaker, actor, token, character, item, args}) {
    if (this.item.system.uses.value != 0) return;
    let effectName = this.item.flags['chris-premades']?.spell?.healingSpirit?.name;
    if (!effectName) return;
    let effect = chris.findEffect(this.actor, effectName);
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let healingSpirit = {
    'item': item,
    'template': template,
    'healing': healing
};