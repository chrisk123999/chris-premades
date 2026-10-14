import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {partOption, persistName} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {radius, cast = true} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    if (!geometry.end) return;
    const tokenSize = sourceToken.width * 0.9;
    const coneSize = geometry.size * 13 / 12;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast) {
        sequence
            .effect()
                .atLocation(sourceToken)
                .file('jb2a.magic_signs.circle.02.evocation.loop.blue')
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
                .belowTokens()
                .fadeOut(2000)
                .zIndex(0)
            .effect()
                .atLocation(sourceToken)
                .file('jb2a.magic_signs.circle.02.evocation.loop.blue')
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
                .belowTokens(true)
                .filter('ColorMatrix', {saturate: -1, brightness: 2})
                .filter('Blur', {blurX: 5, blurY: 10})
                .zIndex(1)
                .duration(1200)
                .fadeIn(200, {ease: 'easeOutCirc', delay: 500})
                .fadeOut(300, {ease: 'linear'})
            .effect()
                .file('jb2a.particles.outward.white.01.02')
                .scaleIn(0, 500, {ease: 'easeOutQuint'})
                .delay(500)
                .fadeOut(1000)
                .atLocation(sourceToken)
                .duration(1000)
                .size(1.75, {gridUnits: true})
                .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.5, gridUnits: true, duration: 1000})
                .zIndex(1)
                .waitUntilFinished(250);
    }
    sequence
        .effect()
            .file('jb2a.dancing_light.blueteal')
            .atLocation(sourceToken)
            .rotateTowards(geometry.end)
            .filter('ColorMatrix', {hue: 10, saturate: -0.5, brightness: 1.5})
            .size(tokenSize, {gridUnits: true})
            .spriteScale({x: 0.5, y: 1.0})
            .spriteOffset({x: 0.25}, {gridUnits: true})
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .fadeIn(500)
            .fadeOut(1000)
            .duration(5000)
        .effect()
            .file('jb2a.extras.tmfx.border.circle.outpulse.01.fast')
            .atLocation(sourceToken)
            .rotateTowards(geometry.end)
            .size(tokenSize, {gridUnits: true})
            .spriteScale({x: 0.5, y: 1.0})
            .spriteOffset({x: 0.25}, {gridUnits: true})
        .effect()
            .file('jb2a.particles.outward.white.02.03')
            .size({width: coneSize, height: coneSize})
            .atLocation(geometry.origin)
            .scaleIn(0, 1500, {ease: 'easeOutSine'})
            .duration(1500)
            .delay(250)
            .fadeIn(250)
            .fadeOut(1250)
            .randomizeMirrorY()
            .moveTowards(geometry.end)
            .filter('ColorMatrix', {hue: 10, saturate: -1, brightness: 2})
            .repeats(7, 500, 500)
            .zIndex(2)
        .effect()
            .file('jb2a.breath_weapons.poison.cone.blue')
            .size(coneSize)
            .atLocation(geometry.origin)
            .rotateTowards(geometry.end)
            .fadeIn(1100)
            .fadeOut(1100)
            .belowTokens()
            .opacity(0.8)
            .playbackRate(0.9)
            .filter('ColorMatrix', {hue: 10, saturate: -1, brightness: 1.8})
            .startTime(3000)
            .duration(5000)
            .zIndex(1)
        .effect()
            .file('jb2a.breath_weapons.poison.cone.blue')
            .size(coneSize)
            .atLocation(geometry.origin)
            .rotateTowards(geometry.end)
            .mirrorY()
            .zIndex(1)
            .fadeOut(1100)
            .opacity(0.1)
            .playbackRate(0.9)
            .filter('ColorMatrix', {saturate: -1, brightness: 1.1})
            .startTime(3000);
    /* eslint-enable indent */
    await sequence.play();
}
async function create(effect, targetToken) {
    const name = persistName('rimesBindingIce', effect);
    const scale = targetToken.texture?.scaleX ?? 1;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .delay(1250)
            .name(name)
            .file('jb2a.extras.tmfx.outflow.circle.02')
            .attachTo(targetToken)
            .belowTokens()
            .scaleToObject(scale * 1.55)
            .opacity(0.45)
            .scaleIn(0, 6000, {ease: 'easeOutExpo'})
            .fadeIn(6000, {delay: 1000, ease: 'easeOutExpo'})
            .persist()
            .tieToDocuments(effect)
        .effect()
            .delay(1250)
            .name(name)
            .file('jb2a.spirit_guardians.blue.particles')
            .attachTo(targetToken)
            .scaleToObject(scale * 1.3)
            .opacity(0.55)
            .filter('ColorMatrix', {saturate: -0.35, brightness: 1.2})
            .scaleIn(0, 6000, {ease: 'easeOutExpo'})
            .fadeIn(6000, {delay: 1000, ease: 'easeOutExpo'})
            .persist()
            .tieToDocuments(effect)
        .effect()
            .delay(1250)
            .name(name)
            .file('jb2a.celestial_bodies.asteroid.single.ice.blue.02')
            .attachTo(targetToken)
            .spriteOffset({x: -0.05}, {gridUnits: true})
            .scaleToObject(scale * 1.5)
            .opacity(0.5)
            .scaleIn(0, 6000, {ease: 'easeOutExpo'})
            .fadeIn(6000, {delay: 1000, ease: 'easeOutExpo'})
            .randomRotation()
            .loopOptions({loops: 1, endOnLastLoop: false})
            .persist()
            .tieToDocuments(effect)
            .filter('ColorMatrix', {contrast: 0})
            .shape('circle', {lineSize: targetToken.parent.grid.size / 2.5, lineColor: '#FF0000', radius: 0.55, gridUnits: true, name: 'mask', isMask: true})
        .play();
    /* eslint-enable indent */
}
async function remove(effect, targetToken) {
    await Sequencer.EffectManager.endEffects({name: persistName('rimesBindingIce', effect), object: targetToken});
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.impact_themed.ice_shard.blue')
            .atLocation(targetToken)
            .belowTokens()
            .scaleToObject((targetToken.texture?.scaleX ?? 1) * 2)
        .play();
    /* eslint-enable indent */
}
export const rimesBindingIce = {
    name: 'CHRISPREMADES.Animations.RimesBindingIce',
    macros: {
        play,
        create,
        delete: remove
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
