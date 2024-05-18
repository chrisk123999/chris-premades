import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let playAnimation = chris.getConfiguration(workflow.item, 'animation');
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
    if (chris.jb2aCheck() === 'patreon') {
        setProperty(updates, 'token.alpha', 0);
        setProperty(updates, 'token.texture.tint', '#beff5c');
    }
    let spawnedTokens = await chris.spawn(sourceActor, updates, {}, workflow.token, 60, 'none');
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    if (playAnimation && chris.jb2aCheck() === 'patreon') animation(spawnedToken);
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
    await warpgate.wait(100);
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
    let selection = await chris.dialog('Healing Spirit: Apply healing?', constants.yesNo);
    if (!selection) return;
    let feature = sourceToken.actor.items.getName('Healing Spirit - Heal');
    if (!feature) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid], undefined, undefined, true);
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
async function animation(token) {
    /* eslint-disable indent */
    //Animations by: eskiemoh
    new Sequence()
        .wait(500)
        .effect()
            .name('Healing Spirit Opening')
            .file('jb2a.energy_strands.in.green.01')
            .atLocation(token)
            .scaleToObject(1)
            .fadeIn(500)
            .fadeOut(500)
            .opacity(0.8)
            .filter('ColorMatrix', {'hue': -15})
            .loopProperty('sprite', 'width', {'from': 0, 'to': -0.05, 'duration': 50, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInCubic'})
            .loopProperty('sprite', 'height', {'from': 0, 'to': -0.05, 'duration': 100, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInQuint'})
        .effect()
            .name('Healing Spirit Opening')
            .file('jb2a.markers.02.yellow')
            .atLocation(token)
            .scaleToObject(1)
            .fadeIn(1000)
            .fadeOut(500)
            .scaleIn(0, 2500, {'ease': 'easeOutCubic'})
            .filter('ColorMatrix', {'hue': 15, 'saturate': 1})
            .loopProperty('sprite', 'width', {'from': 0, 'to': -0.05, 'duration': 50, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInCubic'})
            .loopProperty('sprite', 'height', {'from': 0, 'to': -0.05, 'duration': 100, 'pingPong': true, 'gridUnits': true, 'ease': 'easeInQuint'})
            .zIndex(0)
        .effect()
            .file('jb2a.butterflies.single.yellow')
            .atLocation(token)
            .scaleToObject(1.1, {'considerTokenScale': true})
            .fadeIn(500)
            .zIndex(1)
            .effect()
            .name('Healing Spirit')
            .file('jb2a.energy_field.02.above.green')
            .attachTo(token, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
            .scaleToObject(1.2, {'considerTokenScale': true})
            .fadeOut(500)
            .mask(token)
            .opacity(1)
            .duration(2000)
            .startTime(3000)
        .effect()
            .file('jb2a.misty_step.02.yellow')
            .atLocation(token)
            .scaleToObject(1.5)
            .startTime(1500)
            .filter('ColorMatrix', {'hue': 15})
        .animation()
            .on(token)
            .fadeIn(1500)
            .opacity(0.4)
        .effect()
            .file('jb2a.butterflies.many.yellow')
            .attachTo(token, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
            .scaleToObject(0.9, {'considerTokenScale': true})
            .fadeIn(500)
            .persist()
            .belowTokens()
            .zIndex(1)
        .effect()
            .file('jb2a.butterflies.few.yellow')
            .attachTo(token, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
            .scaleToObject(0.9, {'considerTokenScale': true})
            .fadeIn(500)
            .persist()
            .zIndex(1)
        .effect()
            .file('jb2a.extras.tmfx.outflow.circle.01')
            .attachTo(token, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
            .scaleToObject(1.15, {'considerTokenScale': true})
            .persist()
            .opacity(0.2)
            .belowTokens()
            .tint('#a5fe39')
        .effect()
            .name('Healing Spirit')
            .file('jb2a.energy_field.02.above.green')
            .attachTo(token, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
            .scaleToObject(1.2, {'considerTokenScale': true})
            .fadeIn(500)
            .repeats(3, 800, 800)
            .mask(token)
            .opacity(1)
            .persist()
        .effect()
            .name('Healing Spirit')
            .file(token.texture.src)
            .attachTo(token, {'bindVisibility': false, 'bindAlpha': false, 'followRotation': true})
            .scaleToObject(1, {'considerTokenScale': true})
            .fadeIn(500)
            .rotate(0)
            .persist()
            .filter('Glow', {'color': 0xa5fe39, 'knockout': true, 'distance': 2.5, 'innerStrength': 0})
            .loopProperty('alphaFilter', 'alpha', {'from': 0.1, 'to': 0.8, 'duration': 1250, 'pingPong': true})
            .waitUntilFinished()
        .effect()
            .file('jb2a.misty_step.02.yellow')
            .atLocation(token)
            .scaleToObject(1.5)
            .startTime(1500)
            .filter('ColorMatrix', {'hue': 15})
        .play();
    /* eslint-enable indent */
}
export let healingSpirit = {
    'item': item,
    'template': template,
    'healing': healing,
    'animation': animation
};