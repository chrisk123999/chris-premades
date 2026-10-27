import {animationUtils, documentUtils} from '../../../proxy.mjs';
import {pickFile} from '../generic/spellParts.mjs';
const centers = [
    {x: 0.1, y: -0.4, start: 1500},
    {x: -0.4, y: 0.3, start: 500},
    {x: 0.5, y: 0.4, start: 1500}
];
const rings = [0.15, 0.25, 0.35, 0.45, 0.55];
function addDissolve(sequence, targetToken, isPatreon) {
    const size = targetToken.width * targetToken.parent.grid.size;
    /* eslint-disable indent */
    sequence
        .thenDo(() => documentUtils.update(targetToken, {hidden: true}))
        .effect()
            .file('animated-spell-effects-cartoon.smoke.97')
            .atLocation(targetToken, {offset: {y: -0.25 * targetToken.height}, gridUnits: true})
            .fadeIn(1000)
            .scaleIn(0, 1000, {ease: 'easeOutCubic'})
            .delay(1000)
            .duration(10000)
            .fadeOut(500)
            .scaleToObject(0.5)
            .filter('ColorMatrix', {brightness: 0})
            .zIndex(0.1)
            .belowTokens()
            .playIf(animationUtils.aseCheck())
        .effect()
            .file('jb2a.spirit_guardians.green.particles')
            .atLocation(targetToken)
            .duration(7500)
            .fadeOut(3000)
            .scaleToObject(0.35)
            .filter('ColorMatrix', {hue: -25})
            .belowTokens()
            .playIf(isPatreon);
    for (const center of centers) {
        rings.forEach((radius, index) => {
            sequence
                .effect()
                    .copySprite(targetToken)
                    .atLocation(targetToken)
                    .scaleToObject(1, {considerTokenScale: true})
                    .shape('circle', {
                        lineSize: 25 * targetToken.width,
                        lineColor: '#FF0000',
                        fillColor: index ? undefined : '#FF0000',
                        radius: radius * targetToken.width,
                        gridUnits: true,
                        isMask: true,
                        offset: {x: size * center.x, y: size * center.y}
                    })
                    .duration(center.start + index * 300)
                    .fadeOut(1000);
        });
    }
    /* eslint-enable indent */
}
async function play(sourceToken, targetToken, {killed} = {}) {
    const tier = animationUtils.jb2aCheck();
    if (!sourceToken || !targetToken || !tier) return;
    const isPatreon = tier === 'patreon';
    const circle = pickFile('jb2a.magic_signs.circle.02.transmutation.loop.dark_green', 'jb2a.magic_signs.circle.02.transmutation.loop.dark_yellow');
    /* eslint-disable indent */
    const sequence = new Sequence()
        .effect()
            .atLocation(sourceToken)
            .file(circle)
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: 'easeOutCubic'})
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
            .belowTokens()
            .fadeOut(2000)
            .zIndex(0)
        .effect()
            .atLocation(sourceToken)
            .file(circle)
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: 'easeOutCubic'})
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
            .belowTokens(true)
            .filter('ColorMatrix', {saturate: -1, brightness: 2})
            .filter('Blur', {blurX: 5, blurY: 10})
            .duration(1200)
            .fadeIn(200, {ease: 'easeOutCirc', delay: 500})
            .fadeOut(300, {ease: 'linear'})
            .zIndex(0.1);
    for (const mirror of [false, true]) {
        sequence
            .effect()
                .file('jb2a.particles.outward.white.01.02')
                .scaleIn(0, 1000, {ease: 'easeOutQuint'})
                .delay(500)
                .fadeOut(1000)
                .atLocation(sourceToken)
                .duration(1000)
                .size(1.75 * sourceToken.width, {gridUnits: true})
                .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.5, gridUnits: true, duration: 1000})
                .mirrorX(mirror)
                .zIndex(1)
                .playIf(isPatreon);
    }
    sequence
        .wait(1000)
        .effect()
            .file('jb2a.extras.tmfx.border.circle.inpulse.01.fast')
            .atLocation(sourceToken)
            .tint('#d9df53')
            .scaleToObject(1.5)
            .playIf(isPatreon)
            .waitUntilFinished(-300)
        .effect()
            .file('jb2a.disintegrate.green')
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .zIndex(1)
            .waitUntilFinished(-1000);
    /* eslint-enable indent */
    if (killed) addDissolve(sequence, targetToken, isPatreon);
    return sequence.play();
}
export const disintegrate = {
    name: 'CHRISPREMADES.Animations.Disintegrate',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
