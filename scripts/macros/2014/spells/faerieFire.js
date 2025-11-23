import {actorUtils, animationUtils, effectUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    let templateDoc = await fromUuid(workflow.templateUuid);
    if (!templateDoc) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let color = itemUtils.getConfig(workflow.item, 'color');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.traits.ci.value',
                mode: 2,
                value: 'invisible',
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 10,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                faerieFire: {
                    playAnimation: playAnimation
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['faerieFireOutlined']);
    let tintColor;
    let hue;
    switch (color) {
        case 'blue':
            tintColor = '0x91c5d2';
            hue = 160;
            break;
        case 'green':
            tintColor = '0xd3eb6a';
            hue = 45;
            break;
        case 'purple':
            tintColor = '0xdcace3';
            hue = 250;
    }
    let template = templateDoc.object;
    let position = template.ray.project(0.5);
    let shouldAnimate = playAnimation && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
    if (shouldAnimate) {
        new Sequence()
            .effect()
            .file('animated-spell-effects-cartoon.flash.25')
            .atLocation(position)
            .scale(0.05)
            .playbackRate(1)
            .duration(1500)
            .opacity(0.75)
            .scaleIn(0, 1000, {ease: 'easeOutCubic'})
            .filter('ColorMatrix', {brightness: 0, hue: hue})
            .filter('Blur', {blurX: 5, blurY: 10 })
            .animateProperty('sprite', 'width', {from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'height', {from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: 'easeInOutBack'})
            .belowTokens()

            .effect()
            .file('jb2a.particles.outward.white.01.03')
            .atLocation(position)
            .scale(0.025)
            .playbackRate(1)
            .duration(1500)
            .fadeIn(1500)
            .scaleIn(0, 1500, {ease: 'easeOutCubic'})
            .filter('ColorMatrix', {hue: hue})
            .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 2500, gridUnits :true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'height', {from: 0, to: 1, duration: 2500, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.45, duration: 2500, gridUnits: true})

            .effect()
            .file('jb2a.sacred_flame.target.' + color)
            .atLocation(position)
            .scale(0.05)
            .playbackRate(1)
            .duration(1500)
            .scaleIn(0, 1500, {ease: 'easeOutCubic'})
            .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 2500, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 2500, gridUnits: true, ease: 'easeOutBack'})
            .waitUntilFinished(-200)

            .effect()
            .file('jb2a.impact.010.' + color)
            .atLocation(position, {offset: {y:-0.25}, gridUnits: true})
            .scale(0.45)
            .randomRotation()
            .zIndex(1)

            .effect()
            .file('jb2a.particles.outward.white.01.03')
            .scaleIn(0, 500, {ease: 'easeOutQuint'})
            .fadeOut(1000)
            .atLocation(position, {offset: {y:-0.25}, gridUnits: true})
            .randomRotation()
            .duration(2500)
            .size(3, {gridUnits: true})
            .filter('Glow', {color: tintColor, distance: 10})
            .zIndex(2)

            .effect()
            .file('jb2a.fireflies.{{Pfew}}.02.' + color)
            .atLocation(position, {randomOffset: 0.25})
            .scaleToObject(1.8)
            .randomRotation()
            .duration(750)
            .fadeOut(500)
            .setMustache({
                Pfew: ()=> {
                    let Pfews = ['few','many'];
                    return Pfews[Math.floor(Math.random()*Pfews.length)];
                }
            })
            .repeats(10, 75, 75)
            .zIndex(1)

            .effect()
            .file('animated-spell-effects-cartoon.energy.pulse.yellow')
            .atLocation(position, {offset: {y:-0.25}, gridUnits: true})
            .size(5, {gridUnits: true})
            .filter('ColorMatrix', {saturate: -1, brightness:2, hue: hue})
            .fadeOut(250)
            .filter('Blur', {blurX: 10, blurY: 10})
            .zIndex(0.5)

            .effect()
            .delay(50)
            .file('animated-spell-effects-cartoon.energy.pulse.yellow')
            .atLocation(position, {offset: {y:-0.25}, gridUnits: true})
            .size(5, {gridUnits: true})
            .filter('ColorMatrix', {hue: hue})
            .zIndex(0.5)

            .play();
    }
    if (!workflow.failedSaves.size) return;
    for (let target of workflow.failedSaves) {
        await effectUtils.createEffect(target.actor, effectData, {concentrationItem: workflow.item});
        if (shouldAnimate) {
            new Sequence()
                .effect()
                .file('jb2a.fireflies.many.01.' + color)
                .attachTo(target)
                .scaleToObject(1.4)
                .persist()
                .randomRotation()
                .fadeIn(500, {delay:500})
                .fadeOut(1500, {ease: 'easeInSine'})
                .name('Faerie Fire')
                .private()
    
                .effect()
                .copySprite(target)
                .belowTokens()
                .attachTo(target)
                .scaleToObject(target.document.texture.scaleX)
                .spriteRotation(target.document.texture.rotation*-1)
                .filter('Glow', {color: tintColor, distance: 20})
                .persist()
                .fadeIn(1500, {delay :500})
                .fadeOut(1500, {ease: 'easeInSine'})
                .zIndex(0.1)
                .name('Faerie Fire')
                .play();
        }
    }
}
async function end({trigger: {entity}}) {
    let playAnimation = entity.flags['chris-premades']?.faerieFire?.playAnimation;
    let shouldAnimate = playAnimation && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
    if (!shouldAnimate) return;
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    Sequencer.EffectManager.endEffects({name: 'Faerie Fire', object: token});
}
export let faerieFire = {
    name: 'Faerie Fire',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue'
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green'
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple'
                }
            ]
        }
    ]
};
export let faerieFireOutlined = {
    name: 'Faerie Fire: Outlined',
    version: faerieFire.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};