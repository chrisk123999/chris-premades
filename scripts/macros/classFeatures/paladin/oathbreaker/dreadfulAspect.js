import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'macro.CE',
                'mode': 0,
                'value': 'Frightened',
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'chris-premades': {
                'feature': {
                    'dreadfulAspect': {
                        'sourceTokenUuid': workflow.token.document.uuid
                    }
                }
            },
            'effectmacro': {
                'onTurnEnd': {
                    'script': 'await chrisPremades.macros.dreadfulAspect.turnEnd(effect, origin, token);'
                }
            }
        }
    };
    for (let i of Array.from(workflow.failedSaves)) {
        let effect = chris.findEffect(i.actor, workflow.item.name);
        if (effect) await chris.removeEffect(effect);
        await chris.createEffect(i.actor, effectData);
    }
    let animation = chris.getConfiguration(workflow.item, 'animation');
    if (chris.jb2aCheck() != 'patreon' || !animation) return;
    //Animation by Eskimoh
    await new Sequence()
        .effect()
        .file('jb2a.extras.tmfx.border.circle.inpulse.01.fast')
        .attachTo(workflow.token)
        .scaleToObject(2, {'considerTokenScale': true})
        .filter('ColorMatrix', {'brightness': 0})

        .effect()
        .file('jb2a.token_border.circle.static.purple.004')
        .attachTo(workflow.token)
        .name('Dreadful Aspect')
        .opacity(0.6)
        .scaleToObject(1.7,{'considerTokenScale': true})
        .fadeIn(500)
        .fadeOut(500)
        .duration(2500)
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -5})
        .tint('#e51e19')
        .belowTokens()
        .zIndex(2)

        .effect()
        .file(canvas.scene.background.src)
        .filter('ColorMatrix', {'brightness': 0.3})
        .atLocation({'x': canvas.dimensions.width / 2, 'y': canvas.dimensions.height / 2})
        .size({'width': canvas.scene.width / canvas.grid.size, 'height': canvas.scene.height / canvas.grid.size}, {'gridUnits': true})
        .spriteOffset({'x': -0}, {'gridUnits': true})
        .duration(3000)
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()

        .effect()
        .file('jb2a.particles.outward.red.01.03')
        .attachTo(workflow.token, {'offset': {'y': 0.1}, 'gridUnits': true, 'followRotation': false})
        .size(0.5  * workflow.token.document.width, {'gridUnits': true})
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

        .effect()
        .file('jb2a.cast_generic.ice.01.blue')
        .attachTo(workflow.token, {'offset': {'y': 0.15}, 'gridUnits': true, 'followRotation': true})
        .opacity(1.5)
        .playbackRate(1.5)
        .scaleToObject(1.5, {'considerTokenScale': true})
        .filter('ColorMatrix', {'brightness': 0})
        .waitUntilFinished(-200)

        .effect()
        .file('jb2a.template_circle.aura.01.complete.small.bluepurple')
        .attachTo(workflow.token, {'offset': {'y':0}, 'gridUnits': true, 'followRotation': true})
        .scaleToObject(4, {'considerTokenScale': true})
        .scaleIn(0, 250, {'ease': 'easeOutBack'})
        .scaleOut(0, 6500, {'ease': 'easeInSine'})
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -2})
        .tint('#e51e19')
        .randomRotation()
        .belowTokens()
        .zIndex(3)

        .canvasPan()
        .shake({'duration': 1500, 'strength': 2, 'rotation': false, 'fadeOut': 1500})

        .effect()
        .attachTo(workflow.token)
        .file('jb2a.extras.tmfx.outflow.circle.01')
        .scaleToObject(1.5 * workflow.token.document.texture.scaleX)
        .opacity(1)
        .belowTokens()
        .randomRotation()
        .filter('ColorMatrix', {'brightness': 0})
        .fadeIn(500)
        .fadeOut(500)

        .effect()
        .file('jb2a.impact.003.dark_red')
        .attachTo(workflow.token, {'offset': {'y': 0.1}, 'gridUnits': true, 'followRotation': true})
        .scaleToObject(1, {'considerTokenScale': true})
        .zIndex(2)

        .effect()
        .file('jb2a.impact.004.dark_red')
        .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'followRotation': true})
        .scaleToObject(7.5, {considerTokenScale: true})
        .randomRotation()
        .filter('ColorMatrix', {'brightness': 0})
        .opacity(0.75)
        .scaleIn(0, 1400, {'ease': 'easeOutCubic'})
        .fadeOut(1000)
        .belowTokens()
        .zIndex(2)

        .effect()
        .file('jb2a.extras.tmfx.outpulse.circle.02.fast')
        .attachTo(workflow.token, {'offset': {'y': 0}, 'gridUnits': true, 'followRotation': true})
        .size(13, {'gridUnits': true})
        .opacity(0.5)
        .filter('ColorMatrix', {'brightness': 0})
        .tint('#e51e19')
        .waitUntilFinished()
        .play();

        Array.from(workflow.targets).forEach(target => {   
            new Sequence()
                .effect()
                .file('jb2a.toll_the_dead.red.skull_smoke')
                .attachTo(target)
                .scaleToObject(1.65, {'considerTokenScale': true})
                .filter('ColorMatrix', {'saturate': 0.25, 'hue': -2})
                .zIndex(1)

                .effect()
                .from(target)
                .attachTo(target)
                .fadeIn(500)
                .fadeOut(2000)
                .loopProperty('sprite', 'position.x', {'from': -0.05, 'to': 0.05, 'duration': 55, 'pingPong': true, 'gridUnits': true})
                .filter('ColorMatrix', {'saturate': -1, 'brightness': 0.5})
                .scaleToObject(1, {'considerTokenScale': true})
                .duration(5000)
                .opacity(0.65)
                .zIndex(0.1)

                .effect()
                .file('jb2a.particles.outward.red.01.03')
                .attachTo(target, {'offset': {'y': 0.1}, 'gridUnits': true, 'followRotation': false})
                .size(1 * target.document.width, {'gridUnits': true})
                .duration(1000)
                .fadeOut(800)
                .scaleIn(0, 1000, {'ease': 'easeOutCubic'})
                .animateProperty('sprite', 'width', {'from': 0, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease': 'easeOutBack'})
                .animateProperty('sprite', 'height', {'from': 0, 'to': 1.0, 'duration': 1000, 'gridUnits': true, 'ease': 'easeOutBack'})
                .animateProperty('sprite', 'position.y', {'from': 0, 'to': -0.6, 'duration': 1000, 'gridUnits': true})
                .filter('ColorMatrix', {'saturate': 1, 'hue': 20})
                .zIndex(0.3)

                .play()
        }
    )
}
async function turnEnd(effect, origin, token) {
    let sourceTokenUuid = effect.flags['chris-premades']?.feature?.dreadfulAspect?.sourceTokenUuid;
    if (!sourceTokenUuid || !token) return;
    let sourceToken = await fromUuid(sourceTokenUuid);
    if (sourceToken) {
        if (chris.getDistance(sourceToken.object, token) < 30) return;
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Dreadful Aspect - End of Turn');
    if (!featureData) return;
    delete featureData._id;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Dreadful Aspect - End of Turn');
    featureData.system.save.dc = chris.getSpellDC(origin);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': sourceToken.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    let queueSetup = await queue.setup(origin.uuid, 'dreadfulAspect', 50);
    if (!queueSetup) return;
    await warpgate.wait(100);
    let workflow = await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(origin.uuid);
    if (workflow.failedSaves.size) return;
    await chris.removeEffect(effect);
}
export let dreadfulAspect = {
    'item': item,
    'turnEnd': turnEnd
}