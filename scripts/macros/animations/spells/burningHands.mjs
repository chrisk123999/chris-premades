import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
function playClassic(sourceToken, geometry) {
    /* eslint-disable indent */
    return new Sequence()
        .effect()
            .file('jb2a.energy_strands.in.yellow.01.0')
            .atLocation(sourceToken)
            .anchor({x: 0.15})
            .scaleToObject(1.1)
            .rotateTowards(geometry.end)
            .zIndex(1)
        .effect()
            .file('jb2a.magic_signs.circle.02.evocation.loop.yellow')
            .atLocation(sourceToken)
            .fadeIn(500)
            .fadeOut(500)
            .anchor({x: 0.15})
            .scaleToObject(1.1)
            .duration(5000)
            .rotateTowards(geometry.end)
            .loopProperty('sprite', 'rotation', {from: 0, to: 360, duration: 1000})
            .scaleOut(0.1, 2000, {ease: 'easeOutQuint', delay: -3000})
            .zIndex(2)
        .effect()
            .file('jb2a.particles.outward.orange.01.04')
            .atLocation(sourceToken)
            .fadeIn(500)
            .fadeOut(500)
            .anchor({x: 0.15})
            .scaleToObject(1.1)
            .duration(5000)
            .rotateTowards(geometry.end)
            .loopProperty('sprite', 'rotation', {from: 0, to: 360, duration: 3000})
            .scaleOut(0.175, 5000, {ease: 'easeOutQuint', delay: -3000})
            .waitUntilFinished(-4000)
            .zIndex(1)
        .effect()
            .file('jb2a.impact.010.orange')
            .atLocation(sourceToken)
            .anchor({x: 0.15})
            .scaleToObject(1.1)
            .rotateTowards(geometry.end)
            .zIndex(3)
        .effect()
            .file('jb2a.burning_hands.02.orange')
            .atLocation(geometry.origin)
            .stretchTo(geometry.end)
            .zIndex(3)
        .play();
    /* eslint-enable indent */
}
function playDetailed(sourceToken, geometry) {
    const patreon = animationUtils.jb2aCheck() === 'patreon';
    const offset = (sourceToken.width - 1) / 2;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (patreon) {
        sequence
            .effect()
                .file('jb2a.energy_strands.in.yellow.01')
                .attachTo(sourceToken)
                .rotateTowards(geometry.end)
                .size(1, {gridUnits: true})
                .spriteScale({x: 0.75, y: 1.25})
                .spriteOffset({x: 0.1 + offset}, {gridUnits: true})
                .playbackRate(1.5)
                .waitUntilFinished(-350);
    }
    sequence
        .effect()
            .file('jb2a.template_line_piercing.generic.01.orange.15ft')
            .attachTo(sourceToken)
            .rotateTowards(geometry.end)
            .size({width: 1, height: 0.25}, {gridUnits: true})
            .spriteOffset({x: 0.35 + offset, y: 0}, {gridUnits: true})
            .spriteScale({x: 1.25})
            .spriteRotation(-180)
            .zIndex(1)
            .waitUntilFinished()
        .effect()
            .file('jb2a.impact.010.orange')
            .attachTo(sourceToken)
            .rotateTowards(geometry.end)
            .size(1, {gridUnits: true})
            .spriteScale({x: 0.75, y: 1.25})
            .spriteOffset({x: 0.1 + offset}, {gridUnits: true})
            .playbackRate(1.5);
    if (patreon) {
        sequence
            .effect()
                .file('jb2a.particle_burst.01.star.orangepink')
                .attachTo(sourceToken)
                .rotateTowards(geometry.end)
                .size(1.5, {gridUnits: true})
                .spriteOffset({x: 0.35 + offset}, {gridUnits: true})
                .playbackRate(1.5)
                .zIndex(2)
            .effect()
                .file('jb2a.particles.outward.orange.01.04')
                .attachTo(sourceToken)
                .rotateTowards(geometry.end)
                .spriteOffset({x: 0.5 + offset}, {gridUnits: true})
                .size(1.5, {gridUnits: true})
                .fadeIn(250)
                .fadeOut(500)
                .zIndex(1);
    }
    return sequence
        .effect()
            .file(patreon ? 'jb2a.smoke.puff.side.dark_black' : 'jb2a.smoke.puff.side.grey')
            .attachTo(sourceToken)
            .rotateTowards(geometry.end)
            .spriteOffset({x: 0.35 + offset}, {gridUnits: true})
            .size(2.5, {gridUnits: true})
            .opacity(0.8)
            .fadeOut(500)
        .effect()
            .file(patreon ? 'jb2a.burning_hands.02.orange' : 'jb2a.burning_hands.01.orange')
            .atLocation(geometry.origin)
            .stretchTo(geometry.end)
            .zIndex(1)
        .play({preload: true});
    /* eslint-enable indent */
}
async function play(sourceToken, region, {radius, style = 'detailed'} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    if (!sourceToken || !geometry.end) return;
    if (style === 'classic' && animationUtils.jb2aCheck() === 'patreon') return await playClassic(sourceToken, geometry);
    await playDetailed(sourceToken, geometry);
}
export const burningHands = {
    name: 'CHRISPREMADES.Animations.BurningHands',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            style: {
                default: 'detailed',
                type: 'select',
                label: 'CHRISPREMADES.Animations.SpellParts.Style',
                hint: 'CHRISPREMADES.Animations.BurningHandsStyleHint',
                options: {
                    detailed: {
                        label: 'CHRISPREMADES.Animations.SpellParts.Styles.Detailed'
                    },
                    classic: {
                        label: 'CHRISPREMADES.Animations.SpellParts.Styles.Classic',
                        requirements: ['jb2a_patreon']
                    }
                }
            }
        };
    },
    get credits() {
        return [animationUtils.getCredits('eskie')];
    }
};
