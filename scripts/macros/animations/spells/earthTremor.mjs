import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, addShake, partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true, shake = true, targets = [], radius} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    const patreon = animationUtils.jb2aCheck() === 'patreon';
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, geometry.center, {file: 'jb2a.cast_generic.earth.01.browngreen.0', wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.ground_crack.still_frame.01')
            .atLocation(geometry.center)
            .size(geometry.size)
            .randomRotation()
            .belowTokens()
            .fadeIn(250)
            .duration(5000)
            .fadeOut(1500)
        .effect()
            .file('jb2a.smoke.puff.ring.01.white')
            .atLocation(geometry.center)
            .size(geometry.size)
            .opacity(0.7)
            .belowTokens();
    if (patreon) {
        sequence
            .effect()
                .file('jb2a.impact.ground_crack.white.01')
                .atLocation(geometry.center)
                .size(geometry.size)
                .belowTokens()
                .zIndex(1);
    }
    /* eslint-enable indent */
    targets.forEach(target => addShake(sequence, target.token, {playIf: shake}));
    await sequence.play();
}
export const earthTremor = {
    name: 'CHRISPREMADES.Animations.EarthTremor',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast'),
            shake: partOption('Shake', {hint: 'CHRISPREMADES.Animations.EarthTremorShakeHint'})
        };
    }
};
