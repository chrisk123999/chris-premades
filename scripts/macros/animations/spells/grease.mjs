import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true} = {}) {
    if (!region) return;
    const geometry = getAreaGeometry(sourceToken, region);
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast && sourceToken) {
        sequence
            .effect()
                .file('jb2a.magic_signs.circle.02.conjuration.loop.yellow')
                .attachTo(sourceToken)
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
                .belowTokens()
                .duration(2500)
                .fadeOut(1000)
                .zIndex(0)
            .effect()
                .file('jb2a.particles.outward.white.01.02')
                .atLocation(sourceToken)
                .scaleIn(0, 500, {ease: 'easeOutQuint'})
                .delay(500)
                .fadeOut(1000)
                .duration(1000)
                .size(1.75, {gridUnits: true})
                .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.5, gridUnits: true, duration: 1000})
                .zIndex(1)
                .playIf(isPatreon)
            .wait(750);
    }
    sequence
        .effect()
            .file('jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow')
            .atLocation(geometry.center)
            .size(geometry.size * 1.1)
            .fadeIn(600)
            .fadeOut(1000)
            .duration(7200)
            .rotateIn(180, 600, {ease: 'easeOutCubic'})
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .belowTokens()
        .wait(1000)
        .effect()
            .file('jb2a.water_splash.circle.01.black')
            .atLocation(geometry.center)
            .scaleIn(0, 1500, {ease: 'easeOutCubic'})
            .scaleOut(0, 1500, {ease: 'linear'})
            .fadeIn(500)
            .fadeOut(1000)
            .size(geometry.size * 0.75)
            .belowTokens()
            .zIndex(2)
            .playIf(isPatreon)
        .effect()
            .name('grease ' + region.uuid)
            .file('jb2a.grease.dark_brown.loop')
            .atLocation(geometry.center)
            .size(geometry.size * 1.1)
            .randomRotation()
            .delay(100)
            .fadeIn(5000)
            .scaleIn(0, 5000, {ease: 'easeOutCubic'})
            .fadeOut(1000)
            .scaleOut(0, 1500, {ease: 'linear'})
            .belowTokens()
            .zIndex(1)
            .persist()
            .tieToDocuments(region);
    /* eslint-enable indent */
    await sequence.play();
}
export const grease = {
    name: 'CHRISPREMADES.Animations.Grease.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast')
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
