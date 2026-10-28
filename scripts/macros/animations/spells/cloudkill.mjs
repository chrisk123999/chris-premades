import {animationUtils, regionUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption, pickFile} from '../generic/spellParts.mjs';
import {addFill, moveFill} from '../generic/wallParts.mjs';
function addCloud(sequence, region, {fadeIn}) {
    addFill(sequence, region, pickFile('jb2a.ambient_fog.001.loop.large.greenyellow', 'jb2a.fog_cloud.02.green', 'jb2a.fog_cloud.01.white'), {prefix: 'cloudkill', opacity: 0.6, belowTokens: false, fadeIn, zIndex: 1});
}
async function play(sourceToken, region, {cast = true} = {}) {
    if (!region) return;
    const area = regionUtils.getArea(region);
    const center = {x: area.x, y: area.y};
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, center, {file: getPalette(casts, 'green'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.extras.tmfx.outflow.circle.01')
            .atLocation(center)
            .size(area.radius * 1.5)
            .randomRotation()
            .fadeIn(250)
            .fadeOut(750, {ease: 'easeOutCubic'})
            .duration(2100)
            .opacity(0.2)
            .belowTokens()
        .effect()
            .file('jb2a.particles.outward.greenyellow.01.03')
            .atLocation(center)
            .size(area.radius * 2)
            .fadeOut(1000)
            .duration(3000)
            .zIndex(2);
    /* eslint-enable indent */
    addCloud(sequence, region, {fadeIn: 3000});
    await sequence.play();
}
async function move(region) {
    if (await moveFill(region, 'cloudkill')) return;
    const sequence = new Sequence();
    addCloud(sequence, region, {fadeIn: 500});
    await sequence.play();
}
export const cloudkill = {
    name: 'CHRISPREMADES.Animations.Cloudkill',
    macros: {
        play,
        move
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast')
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
