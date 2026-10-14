import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, casts, getPalette} from '../generic/spellParts.mjs';
const puddles = {
    patreon: 'jb2a.grease.dark_green.loop',
    free: 'jb2a.grease.dark_brown.loop'
};
const puddleOffsets = [
    {x: 0.25, y: 0.3},
    {x: -0.4, y: 0},
    {x: 0.15, y: -0.5}
];
function addFlask(sequence, sourceToken, end) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.markers.bubble.02.complete.green.0')
            .atLocation(sourceToken)
            .scale(0.1)
            .rotateTowards(end)
            .rotate(90)
            .duration(5100)
            .fadeOut(1000)
            .spriteOffset({x: -0.2, y: 0.1}, {gridUnits: true})
            .zIndex(3)
        .effect()
            .file('jb2a.markers.light_orb.complete.green')
            .atLocation(sourceToken)
            .scale(0.25)
            .rotateTowards(end)
            .playbackRate(1.5)
            .duration(5100)
            .scaleOut(0, 2000, {ease: 'easeOutCubic'})
            .spriteOffset({x: -0.1}, {gridUnits: true})
            .zIndex(2)
        .effect()
            .file('jb2a.smoke.puff.side.green')
            .delay(1700)
            .atLocation(sourceToken)
            .rotateTowards(end)
            .scaleToObject(1.5)
            .opacity(0.75)
            .zIndex(2);
    /* eslint-enable indent */
}
async function play(sourceToken, region, {radius} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    if (!geometry.end) return;
    const sequence = new Sequence();
    if (animationUtils.jb2aCheck() === 'patreon') addFlask(sequence, sourceToken, geometry.end);
    else addCast(sequence, sourceToken, geometry.end, {file: getPalette(casts, 'green')});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.breath_weapons.acid.line.green')
            .atLocation(geometry.origin)
            .stretchTo(geometry.end)
            .playbackRate(1.5)
            .zIndex(1);
    /* eslint-enable indent */
    await sequence.play();
}
async function create(effect, targetToken) {
    const file = puddles[animationUtils.jb2aCheck()];
    if (!file) return;
    const sequence = new Sequence();
    puddleOffsets.forEach(offset => {
        /* eslint-disable indent */
        sequence
            .effect()
                .name('Tasha\'s Caustic Brew')
                .file(file)
                .delay(2200)
                .attachTo(targetToken, {offset: {x: offset.x * targetToken.width, y: offset.y * targetToken.width}, gridUnits: true, followRotation: false})
                .randomRotation()
                .scaleToObject(0.4)
                .opacity(0.8)
                .fadeIn(2000)
                .fadeOut(2000)
                .scaleIn(0, 1500)
                .persist()
                .tieToDocuments(effect);
        /* eslint-enable indent */
    });
    await sequence.play();
}
export const tashasCausticBrew = {
    name: 'CHRISPREMADES.Animations.TashasCausticBrew',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
