import {animationUtils} from '../../../proxy.mjs';
import {persistName} from '../generic/spellParts.mjs';
async function create(effect, targetToken) {
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const hasAse = animationUtils.aseCheck();
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
            .atLocation(targetToken)
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: 'easeOutCubic'})
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
            .belowTokens()
            .duration(1400)
            .fadeOut(400)
            .waitUntilFinished()
        .effect()
            .file('animated-spell-effects-cartoon.energy.pulse.yellow')
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .belowTokens()
            .zIndex(1)
            .playIf(hasAse)
        .effect()
            .file('animated-spell-effects-cartoon.air.puff.03')
            .atLocation(targetToken)
            .scaleToObject(1.75)
            .belowTokens()
            .playIf(hasAse)
        .animation()
            .on(targetToken)
            .opacity(0)
        .effect()
            .name(persistName('fly', effect))
            .copySprite(targetToken)
            .attachTo(targetToken, {bindAlpha: false})
            .scaleToObject(1, {considerTokenScale: true})
            .duration(800)
            .anchor({x: 0.5, y: 0.7})
            .animateProperty('sprite', 'position.y', {from: 30, to: 0, duration: 500, ease: 'easeOutBack'})
            .loopProperty('sprite', 'position.y', {from: 0, to: -30, duration: 2500, pingPong: true, delay: 500})
            .zIndex(2)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(persistName('fly', effect))
            .file('jb2a.particles.outward.orange.02.04')
            .attachTo(targetToken, {bindAlpha: false})
            .scaleToObject(1.35, {considerTokenScale: true})
            .anchor({x: 0.5, y: 0.6})
            .loopProperty('sprite', 'position.y', {from: 0, to: -30, duration: 2500, pingPong: true, delay: 500})
            .fadeIn(1000)
            .zIndex(2.2)
            .persist()
            .tieToDocuments(effect)
            .playIf(isPatreon)
        .effect()
            .name(persistName('fly', effect))
            .copySprite(targetToken)
            .attachTo(targetToken, {bindAlpha: false})
            .scaleToObject(0.9)
            .duration(1000)
            .opacity(0.5)
            .belowTokens()
            .filter('ColorMatrix', {brightness: -1})
            .filter('Blur', {blurX: 5, blurY: 10})
            .zIndex(1)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
async function remove(effect, targetToken) {
    await Sequencer.EffectManager.endEffects({name: persistName('fly', effect), object: targetToken});
    await new Sequence().animation().on(targetToken).opacity(1).play();
}
export const fly = {
    name: 'CHRISPREMADES.Animations.Fly',
    macros: {
        create,
        delete: remove
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
