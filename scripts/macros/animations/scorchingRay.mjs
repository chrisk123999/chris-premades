import {animationUtils, genericUtils} from '../../proxy.mjs';
const colorMap = {
    orange: 'Orange',
    blue: 'Blue',
    green: 'Green',
    pink: 'Pink',
    purple: 'Purple'
};
const dynamicColors = Object.keys(colorMap);
let lastColor = Math.floor(Math.random() * dynamicColors.length);
async function start(sourceToken, {type = 'complex'} = {}) {
    if (type === 'simple') return;
    /* eslint-disable indent */
        new Sequence()
            .effect()
                .atLocation(sourceToken.object)
                .file('jb2a.magic_signs.circle.02.evocation.loop.yellow')
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
                .belowTokens()
                .fadeOut(2000)
                .zIndex(0)
                .persist()
                .attachTo(sourceToken.object)
                .name('Scorching Ray')
            .effect()
                .atLocation(sourceToken.object)
                .file('jb2a.magic_signs.circle.02.evocation.loop.yellow')
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
                .belowTokens(true)
                .filter('ColorMatrix', {saturate: -1, brightness: 2})
                .filter('Blur', {blurX: 5, blurY: 10 })
                .zIndex(1)
                .duration(1200)
                .fadeIn(200, {ease: 'easeOutCirc', delay: 500})
                .fadeOut(300, {ease: 'linear'})
                .persist()
                .attachTo(sourceToken.object)
                .name('Scorching Ray')
            .effect()
                .file('jb2a.particles.outward.white.01.02')
                .scaleIn(0, 500, {ease: 'easeOutQuint'})
                .delay(500)
                .fadeOut(1000)
                .atLocation(sourceToken.object)
                .duration(1000)
                .size(1.75 * sourceToken.width, {gridUnits: true})
                .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.5, gridUnits: true, duration: 1000})
                .zIndex(1)
                .waitUntilFinished(-200)
            .play();
        /* eslint-enable indent */
}
async function attack(sourceToken, targetToken, {missed, sound, color = 'orange', type = 'complex'} = {}) {
    await animationUtils.preloadAnimations('jb2a.scorching_ray');
    if (color === 'random') {
        color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
    } else if (color === 'cycle') {
        color = dynamicColors[lastColor];
        lastColor = (lastColor + 1) % dynamicColors.length;
    }
    if (type === 'simple') {
        const simplePath = 'jb2a.scorching_ray.01.' + color;
        return await animationUtils.simpleAttack(sourceToken, targetToken, simplePath, {sound, missed});
    }
    const tokenCenter = sourceToken.object.center;
    const targetCenter = targetToken.object.center;
    const directionVector = {
        x: targetCenter.x - tokenCenter.x,
        y: targetCenter.y - tokenCenter.y
    };
    const distance = Math.sqrt(directionVector.x * directionVector.x + directionVector.y * directionVector.y);
    const normalizedDirectionVector = {
        x: directionVector.x / distance,
        y: directionVector.y / distance
    };
    const magicCircleDistance = canvas.grid.size / 3;
    const magicCircle = {
        x: tokenCenter.x + normalizedDirectionVector.x * magicCircleDistance,
        y: tokenCenter.y + normalizedDirectionVector.y * magicCircleDistance
    };
    const path = 'jb2a.scorching_ray.{{num}}.' + color;
    const particle = 'jb2a.particles.outward.orange.01.03';
    /* eslint-disable indent */
        new Sequence()
            .wait(150)
            .effect()
                .file(path)
                .atLocation(magicCircle)
                .scale(0.6)
                .stretchTo(targetToken.object, {randomOffset: 0.75})
                .setMustache({
                    num: function() {
                        const nums = ['01', '02', '02'];
                        return nums[Math.floor(Math.random() * nums.length)];
                    }
                })
                .randomizeMirrorY()
                .zIndex(1)
                .missed(missed)
            .sound()
                .playIf(sound)
                .file(sound)
            .effect()
                .delay(200)
                .copySprite(targetToken.object)
                .attachTo(targetToken.object)
                .fadeIn(200)
                .fadeOut(500)
                .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(targetToken.texture.scaleX)
                .duration(1800)
                .opacity(0.25)
                .tint('#fb8b23')
            .effect()
                .delay(200, 500)
                .file(particle)
                .attachTo(targetToken.object, {randomOffset: 0.2})
                .zIndex(1)
                .fadeIn(500)
                .fadeOut(1200)
                .duration(4500)
                .scaleToObject(1.5)
                .randomRotation()
            .play();
        /* eslint-enable indent */
}
async function end(sourceToken) {
    await genericUtils.sleep(1500);
    Sequencer.EffectManager.endEffects({name: 'Scorching Ray', object: sourceToken.object});
}
export const scorchingRay = {
    name: 'CHRISPREMADES.Animations.ScorchingRay',
    macros: {
        start,
        attack,
        end
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    type: 'rangedAttack',
    get config() {
        return {
            type: {
                default: 'complex',
                type: 'select',
                label: 'CHRISPREMADES.Config.Animation',
                options: {
                    simple: {
                        label: 'CHRISPREMADES.Config.Animations.Simple'
                    },
                    complex: {
                        label: 'CHRISPREMADES.Config.Animations.Complex',
                        requirements: ['jb2a_patreon']
                    }
                }
            },
            color: {
                default: 'orange',
                type: 'select',
                label: 'CHRISPREMADES.Config.Generic.Color',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['orange'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.'
                })
            },
            sound: {
                label: 'CHRISPREMADES.Config.Generic.Sound',
                type: 'file',
                fileType: 'audio',
                default: ''
            }
        };
    }
};