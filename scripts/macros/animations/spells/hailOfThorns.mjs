import {animationUtils} from '../../../proxy.mjs';
import {addCast, addImpact, addShake, casts, getPalette, partOption} from '../generic/spellParts.mjs';
const spikes = {
    patreon: 'jb2a.ice_spikes.radial.burst.grey',
    free: 'jb2a.ice_spikes.radial.burst.white'
};
async function play(sourceToken, targetToken, {cast = true, shake = true, targets = [], radius = 5} = {}) {
    const scene = targetToken.parent;
    const size = targetToken.width + (radius * 2 / scene.grid.distance);
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: getPalette(casts, 'green'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.entangle.green')
            .atLocation(targetToken)
            .size(size, {gridUnits: true})
            .belowTokens()
            .fadeIn(250)
            .fadeOut(750)
            .duration(2500)
        .effect()
            .file(spikes[animationUtils.jb2aCheck()])
            .atLocation(targetToken)
            .size(size * 1.25, {gridUnits: true})
            .randomRotation()
            .zIndex(1)
        .wait(400);
    /* eslint-enable indent */
    targets.filter(target => target.saved === false).forEach(target => {
        addImpact(sequence, target.token, 'grey', {scale: 0.75});
        addShake(sequence, target.token, {playIf: shake});
    });
    await sequence.play();
}
export const hailOfThorns = {
    name: 'CHRISPREMADES.Animations.HailOfThorns',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast'),
            shake: partOption('Shake')
        };
    }
};
