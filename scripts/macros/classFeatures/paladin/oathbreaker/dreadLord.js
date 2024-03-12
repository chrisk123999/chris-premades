import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {effectAuras} from '../../../../utility/effectAuras.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Dread Lord Shadow Attack', false);
    if (!featureData) return;
    delete featureData._id;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dread Lord Shadow Attack');
    let effectData = {
        'name': 'Dread Lord',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'flags.chris-premades.aura.dreadLord.name',
                'mode': 5,
                'value': 'Dread Lord',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.aura.dreadLord.range',
                'mode': 5,
                'value': 30,
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.aura.dreadLord.disposition',
                'mode': 5,
                'value': 'ally',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.aura.dreadLord.effectName',
                'mode': 5,
                'value': 'Dread Lord\'s Shadow',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.aura.dreadLord.macroName',
                'mode': 5,
                'value': 'dreadLord',
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.aura.dreadLord.self',
                'mode': 5,
                'value': false,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.grants.disadvantage.attack.all',
                'value': 1,
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'await chrisPremades.macros.dreadLord.end(token, origin);'
                },
                'onEachTurn': {
                    'script': 'await chrisPremades.macros.dreadLord.turnStart(token, origin);'
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
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Dread Lord',
        'description': 'Dread Lord'
    };
    let flagAuras = {
        'dreadLord': {
            'name': 'dreadLord',
            'range': 30,
            'disposition': 'ally',
            'effectName': 'Dread Lord\'s Shadow',
            'macroName': 'dreadLord',
            'self': false
        }
    };
    let animation = chris.getConfiguration(workflow.item, 'animation');
    if (chris.jb2aCheck() != 'patreon') animation = false;
    let avatarImg = chris.getConfiguration(workflow.item, 'avatar');
    let tokenImg = chris.getConfiguration(workflow.item, 'token');
    if (avatarImg) setProperty(updates, 'actor.img', avatarImg);
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    if (!animation) {
        await warpgate.mutate(workflow.token.document, updates, {}, options);
        effectAuras.add(flagAuras, workflow.token.document.uuid, true);
    } else {
        //Animation by Eskimoh
        new Sequence()
            .effect()
                .file('jb2a.energy_strands.in.red.01')
                .attachTo(workflow.token)
                .scaleToObject(9, {'considerTokenScale': true})
                .filter('ColorMatrix', {'brightness': 0})
                .randomRotation()
                .belowTokens()
                .zIndex(0.1)

            .effect()
                .file('jb2a.token_border.circle.static.purple.004')
                .name('Dread Lord')
                .attachTo(workflow.token)
                .opacity(0.6)
                .scaleToObject(1.7, {'considerTokenScale': true})
                .fadeIn(500)
                .fadeOut(500)
                .duration(2500)
                .filter('ColorMatrix', {'saturate': 0.5, 'hue': -5})
                .tint('#e51e19')
                .belowTokens()
                .zIndex(2)

            .effect()
                .playIf(!!canvas.scene.background.src)
                .file(canvas.scene.background.src)
                .filter('ColorMatrix', {'brightness': 0.3})
                .atLocation({'x': canvas.dimensions.width / 2, 'y': canvas.dimensions.height / 2})
                .size({'width': canvas.scene.width / canvas.grid.size, 'height': canvas.scene.height / canvas.grid.size}, {'gridUnits': true})
                .spriteOffset({'x': 0}, {'gridUnits': true})
                .duration(7000)
                .fadeIn(500)
                .fadeOut(1000)
                .belowTokens()

            .effect()
                .file('jb2a.particles.outward.red.01.03')
                .attachTo(workflow.token, {'offset': {'y': 0.1}, 'gridUnits': true, 'followRotation': false})
                .size(0.5 * workflow.token.document.width, {'gridUnits': true})
                .duration(1000)
                .fadeOut(800)
                .scaleIn(0, 1000, {'ease': 'easeOutCubic'})
                .animateProperty('sprite', 'width', {'from': 0, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease': 'easeOutBack'})
                .animateProperty('sprite', 'height', {'from': 0, 'to': 1.0, 'duration': 1000, 'gridUnits': true, 'ease': 'easeOutBack'})
                .animateProperty('sprite', 'position.y', {'from': 0, 'to': -0.6, 'duration': 1000, 'gridUnits': true})
                .filter('ColorMatrix', {'saturate': 1, 'hue': 20})
                .zIndex(0.3)

            .effect()
                .file('jb2a.flames.04.complete.purple')
                .attachTo(workflow.token, {'offset': {'y': -0.35}, 'gridUnits': true, 'followRotation': true})
                .scaleToObject(1.5 * workflow.token.document.texture.scaleX)
                .tint('#e51e19')
                .fadeOut(500)
                .scaleOut(0, 500, {'ease': 'easeOutCubic'})
                .duration(2500)
                .zIndex(1)
                .waitUntilFinished(-500)

            .effect()
                .file('jb2a.impact.ground_crack.dark_red.01')
                .atLocation(workflow.token)
                .belowTokens()
                .filter('ColorMatrix', {'hue': -15, 'saturate': 1})
                .size(7, {'gridUnits': true})
                .tint('#e51e19')
                .zIndex(0.1)
                .thenDo(async function(){
                    await warpgate.mutate(workflow.token.document, updates, {}, options);
                    effectAuras.add(flagAuras, workflow.token.document.uuid, true);
                })
                .canvasPan()
                .shake({'duration': 3000, 'strength': 2, 'rotation': false, 'fadeOut': 3000})

            .effect()
                .file('jb2a.token_border.circle.static.purple.004')
                .name('Dread Lord')
                .attachTo(workflow.token)
                .opacity(0.6)
                .scaleToObject(1.7, {'considerTokenScale': true})
                .fadeIn(250)
                .fadeOut(500)
                .duration(2500)
                .filter('ColorMatrix', {'saturate': 0.5, 'hue': -5})
                .tint('#e51e19')
                .persist()
                .zIndex(2)

            .effect()
                .name('Dread Lord')
                .file('jb2a.energy_strands.complete.dark_red.01')
                .attachTo(workflow.token)
                .scaleToObject(2, {'considerTokenScale': true})
                .opacity(1)
                .filter('ColorMatrix', {'brightness': 0})
                .scaleIn(0, 1000, {'ease': 'easeOutBack'})
                .belowTokens()
                .persist()
                .zIndex(3)

            .effect()
                .name('Dread Lord')
                .file('jb2a.energy_strands.overlay.dark_red.01')
                .attachTo(workflow.token)
                .scaleToObject(2, {'considerTokenScale': true})
                .filter('ColorMatrix', {'brightness': 0})
                .scaleIn(0, 1000, {'ease': 'easeOutBack'})
                .belowTokens()
                .persist()
                .zIndex(3)

            .effect()
                .name('Dread Lord')
                .file('jb2a.template_circle.aura.01.complete.small.bluepurple')
                .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'followRotation': true})
                .size(7.5, {'gridUnits': true})
                .opacity(0.7)
                .scaleIn(0, 250, {'ease': 'easeOutBack'})
                .scaleOut(0, 6500, {'ease': 'easeInSine'})
                .filter('ColorMatrix', {'saturate': 0.5, 'hue': -2})
                .tint('#e51e19')
                .randomRotation()
                .belowTokens()
                .persist()
                .zIndex(0.3)

            .effect()
                .name('Dread Lord')
                .file('jb2a.extras.tmfx.outflow.circle.02')
                .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'followRotation': true})
                .size(13, {'gridUnits': true})
                .opacity(0.65)
                .scaleIn(0, 250, {'ease': 'easeOutBack'})
                .scaleOut(0, 6500, {'ease': 'easeInSine'})
                .filter('ColorMatrix', {'brightness': 0})
                .belowTokens()
                .persist()
                .zIndex(0.2)

            .effect()
                .name('Dread Lord')
                .file('jb2a.extras.tmfx.outflow.circle.01')
                .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'followRotation': true})
                .size(13, {'gridUnits': true})
                .opacity(0.7)
                .scaleIn(0, 250, {'ease': 'easeOutBack'})
                .scaleOut(0, 6500, {'ease': 'easeInSine'})
                .filter('ColorMatrix', {'brightness': 0})
                .rotate(90)
                .loopProperty('sprite', 'rotation', {'from': 0, 'to': 360, 'duration': 20000})
                .belowTokens()
                .persist()
                .zIndex(0.3)

            .effect()
                .file('jb2a.impact.003.dark_red')
                .attachTo(workflow.token, {'offset': {'y': 0.1}, 'gridUnits': true, 'followRotation': true})
                .scaleToObject(1, {'considerTokenScale': true})
                .zIndex(2)

            .play()
    }
}
async function aura(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Dread Lord');
    if (!auraEffect) return;
    let originItem = await fromUuid(auraEffect.origin);
    if (!originItem) return;
    let effectData = {
        'name': 'Dread Lord\'s Shadow',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'flags.midi-qol.grants.disadvantage.attack.all',
                'value': 1,
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true,
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    let effect = chris.findEffect(token.actor, effectData.name);
    if (effect?.origin === effectData.origin) return;
    if (effect) chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let feature = chris.getItem(workflow.actor, 'Dread Lord');
    if (!feature) return;
    let animation = chris.getConfiguration(feature, 'animation');
    if (chris.jb2aCheck() != 'patreon' || !animation) return;
    let target = workflow.targets.first();
    //Animation by Eskimoh
    new Sequence()
        .effect()
        .file('jb2a.melee_generic.piercing.two_handed')
        .atLocation(target)
        .spriteOffset({'x': -5.6, 'y': 0.1}, {'gridUnits': true})
        .size(8, {'gridUnits': true})
        .rotateTowards(workflow.token)
        .playbackRate(0.8)
        .randomizeMirrorY()
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0})
        .rotate(180)
        .zIndex(1)
        
        .effect()
        .from(target)
        .attachTo(target)
        .fadeIn(500)
        .fadeOut(500)
        .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 55, 'pingPong': true, 'gridUnits': true})
        .filter("ColorMatrix", {'saturate': -1, 'brightness': 0.5})
        .scaleToObject(1, {'considerTokenScale': true})
        .opacity(0.65)
        .zIndex(0.1)
        
        .play();
}
async function end(token, origin) {
    await warpgate.revert(token.document, 'Dread Lord');
    effectAuras.remove('dreadLord', token.document.uuid);
    if (chris.getConfiguration(origin, 'animation')) Sequencer.EffectManager.endEffects({'name': 'Dread Lord', 'object': token});
}
async function turnStart(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.document.disposition === token.document.disposition) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 30) return;
    let effect = targetToken.effects.find(i => i.name === 'Frightened' && i.origin === token.document.uuid);
    if (!effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Dread Lord - Turn Start', false);
    if (!featureData) return;
    delete featureData._id;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dread Lord - Turn Start');
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    let queueSetup = await queue.setup(origin.uuid, 'dreadLord', 50);
    if (!queueSetup) return;
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(origin.uuid);
}
export let dreadLord = {
    'item': item,
    'attack': attack,
    'end': end,
    'turnStart': turnStart,
    'aura': aura
}