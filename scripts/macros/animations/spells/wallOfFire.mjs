import {animationUtils, regionUtils} from '../../../proxy.mjs';
import {partOption} from '../generic/spellParts.mjs';
import {addDome, addFill, addStrips} from '../generic/wallParts.mjs';
function addFlare(sequence, segments, grid) {
    segments.forEach(([start, end]) => {
        const steps = Math.max(1, Math.round(Math.hypot(end.x - start.x, end.y - start.y) / grid));
        for (let step = 0; step <= steps; step++) {
            /* eslint-disable indent */
            sequence
                .effect()
                    .file('jb2a.flames.02.orange')
                    .atLocation({x: start.x + (end.x - start.x) * step / steps, y: start.y + (end.y - start.y) * step / steps}, {offset: {y: -0.5}, gridUnits: true})
                    .size({width: 2, height: 1.5}, {gridUnits: true})
                    .delay(step * 40)
                    .duration(1000)
                    .fadeIn(200)
                    .fadeOut(800)
                    .randomizeMirrorX()
                    .zIndex(1);
            /* eslint-enable indent */
        }
    });
}
async function play(sourceToken, region, {cast = true, shimmer = true, path, side: heat} = {}) {
    if (!region || !path?.points?.length) return;
    const grid = region.parent.grid.size;
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const segments = regionUtils.pathSegments(path);
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast && sourceToken) {
        sequence
            .effect()
                .file('jb2a.cast_generic.fire.01.orange')
                .attachTo(sourceToken)
                .scaleToObject(2.25)
                .belowTokens()
                .scaleOut(0, 1500, {ease: 'easeOutCubic'})
                .zIndex(2)
            .wait(750);
    }
    /* eslint-enable indent */
    addFlare(sequence, segments, grid);
    if (path.ring && isPatreon) addDome(sequence, region, path.ring, 'jb2a.wall_of_fire.ring.yellow', {prefix: 'wallOfFire', scale: 1.15});
    else addStrips(sequence, region, path, 'jb2a.wall_of_fire.300x100.yellow', {prefix: 'wallOfFire'});
    if (shimmer && heat && isPatreon) addFill(sequence, heat, 'jb2a.particles.outward.orange.01.04', {prefix: 'wallOfFire', opacity: 0.8});
    await sequence.play();
}
export const wallOfFire = {
    name: 'CHRISPREMADES.Animations.WallOfFire',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        shimmer: partOption('Shimmer', {hint: 'CHRISPREMADES.Animations.WallOfFireShimmerHint'})
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
