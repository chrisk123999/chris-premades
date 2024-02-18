import {chris} from '../../../../helperFunctions.js';
async function early({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        'name': 'Invalid Target',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'value': 99,
                'mode': 5,
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            },
            'chris-premades': {
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    for (let i of Array.from(workflow.targets)) if (chris.raceOrType(i.actor) != 'undead') await chris.createEffect(i.actor, effectData);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let animation = chris.getConfiguration(workflow.item, 'animation');
    if (chris.jb2aCheck() != 'patreon' || !animation) return;
    //Animation by Eskimoh
    if (!workflow.targets.size) return;
    let targetToken = workflow.targets.first();
    let failedSave = workflow.failedSaves.size;
    new Sequence()
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
        .file('jb2a.magic_signs.rune.necromancy.intro.red')
        .attachTo(targetToken)
        .scaleToObject(0.5)
        .scaleOut(0, 1000, {'ease': 'easeInBack'})
        .fadeOut(500, {'ease': 'easeInCubic'})
        .zIndex(1)

        .effect()
        .file('jb2a.markers.02.red')
        .atLocation(workflow.token)
        .rotateTowards(targetToken)
        .spriteOffset({'x': -0.2}, {'gridUnits': true})
        .spriteScale({'x': 0.8, 'y': 1})
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -2})
        .rotate(0)
        .scaleToObject(1)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'position.x', {'from': -0.5, 'to': 0.05, 'duration': 1000, 'gridUnits': true, 'ease': 'easeOutBack', 'delay': 0})
        .animateProperty('sprite', 'width', {'from': 0.8, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease': 'easeOutBack', 'delay': 1500})
        .animateProperty('sprite', 'height', {'from': 1, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease': 'easeOutBack', 'delay': 1500})
        .filter('Glow', {'color': 0x000000 })
        .fadeOut(1000)
        .zIndex(1)

        .effect()
        .file('jb2a.particle_burst.01.circle.bluepurple')
        .atLocation(workflow.token)
        .rotateTowards(targetToken)
        .spriteOffset({x:-0.2}, {'gridUnits': true})
        .spriteScale({x:0.8,y:1})
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -2})
        .rotate(0)
        .scaleToObject(1)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'position.x', {'from': -0.5, 'to': 0.05, 'duration': 1000, 'gridUnits': true, 'ease':'easeOutBack', 'delay': 0})
        .tint('#e51e19')
        .zIndex(0)

        .effect()
        .file('jb2a.particle_burst.01.circle.bluepurple')
        .attachTo(targetToken)
        .scaleToObject(1.5)
        .filter('ColorMatrix', {'saturate': 0.5, 'hue': -2})
        .tint('#e51e19')
        .belowTokens()
        .zIndex(0)

        .effect()
        .delay(550)
        .file('jb2a.smoke.puff.centered.dark_black')
        .attachTo(targetToken)
        .scaleToObject(1.8)
        .scaleOut(0, 1000, {'ease': 'easeInBack'})
        .randomRotation()
        .belowTokens()

        .effect()
        .delay(750)
        .file('jb2a.particles.outward.red.01.03')
        .atLocation(workflow.token)
        .rotateTowards(targetToken)
        .spriteOffset({'x': -0.5, 'y': -0.1}, {'gridUnits': true})
        .filter('ColorMatrix', {'saturate':1, 'hue': -2})
        .spriteScale({'x': 0.8,'y': 1})
        .scaleToObject(2.5)
        .scaleIn(0, 1500, {'ease': 'easeOutCubic'})
        .tint('#e51e19')
        .duration(1500)
        .fadeOut(1500)
        .waitUntilFinished(-1500)

        .effect()
        .name('Control Undead')
        .from(targetToken)
        .attachTo(targetToken,{'bindAlpha': false})
        .opacity(0.75)
        .mirrorX(targetToken.document.texture.scaleX != 0)
        .scaleToObject(1, {'considerTokenScale': true})
        .tint('#e51e19')
        .fadeIn(500)
        .fadeOut(500)
        .duration(1000)
        .playIf(failedSave)

        .effect()
        .delay(100)
        .file('jb2a.particles.outward.white.01.03')
        .attachTo(targetToken, {'offset': {'y': 0.2}, 'gridUnits': true, 'followRotation': false})
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, {'ease': 'easeOutCubic'})
        .animateProperty('sprite', 'width', {'from': 0, 'to': 0.25, 'duration': 500, 'gridUnits': true, 'ease':'easeOutBack'})
        .animateProperty('sprite', 'height', {'from': 0, 'to': 1.0, 'duration': 1000, 'gridUnits': true, 'ease':'easeOutBack'})
        .animateProperty('sprite', 'position.y', {'from': -0, 'to': -0.6, 'duration': 1000, 'gridUnits': true})
        .tint('#e51e19')
        .filter('Blur', {'blurX': 0, 'blurY': 5})
        .opacity(0.8)
        .zIndex(0.3)
        .playIf(failedSave)

        .effect()
        .delay(750)
        .file('jb2a.static_electricity.03.dark_red')
        .atLocation(targetToken)
        .size(1.25, {'gridUnits': true})
        .opacity(1)
        .playbackRate(1)
        .randomRotation()
        .zIndex(0.3)
        .playIf(failedSave)

        .effect()
        .delay(500)
        .name('Control Undead')
        .file('jb2a.extras.tmfx.outflow.circle.01')
        .attachTo(targetToken, {'cacheLocation': true, 'offset': {'y':0}, 'gridUnits': true, 'bindAlpha': false})
        .scaleToObject(1.45, {'considerTokenScale': true})
        .randomRotation()
        .fadeIn(1000)
        .fadeOut(500)
        .belowTokens()
        .opacity(0.45)
        .loopProperty('alphaFilter', 'alpha', {'from': 0.75, 'to': 1, 'duration': 1500, 'pingPong': true, 'ease': 'easeOutSine'})
        .filter('ColorMatrix', { 'brightness':0 })
        .persist()
        .playIf(failedSave)

        .effect()
        .delay(500)
        .name('Control Undead')
        .from(targetToken)
        .attachTo(targetToken,{'bindAlpha': false})
        .belowTokens()
        .mirrorX(targetToken.document.texture.scaleX < 0)
        .scaleToObject(1, {'considerTokenScale': true})
        .loopProperty('alphaFilter', 'alpha', {'from': 0.75, 'to': 1, 'duration': 1500, 'pingPong': true, 'ease': 'easeOutSine'})
        .filter('Glow', {'color': 0xe51e19, 'distance': 5, 'outerStrength':4, 'innerStrength': 0 })
        .fadeIn(1000)
        .fadeOut(500)
        .persist()
        .zIndex(0.1)
        .playIf(failedSave)

        .play()
}
async function end(token, origin) {
    let animation = chris.getConfiguration(origin, 'animation');
    if (!animation) return;
    await Sequencer.EffectManager.endEffects({'name': 'Control Undead', 'object': token});
}
export let controlUndead = {
    'early': early,
    'item': item,
    'end': end
}