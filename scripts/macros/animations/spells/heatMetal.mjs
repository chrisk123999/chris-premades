import {animationUtils} from '../../../proxy.mjs';
import {addCast, addShake, casts, getPalette, partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, targetToken, {cast = true, shake = true} = {}) {
    if (!animationUtils.jb2aCheck() || !targetToken) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: getPalette(casts, 'orange'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.fire.01.orange')
            .atLocation(targetToken)
            .scaleToObject(1.4)
            .zIndex(2)
        .effect()
            .file('jb2a.flames.01.orange')
            .attachTo(targetToken)
            .scaleToObject(1.3)
            .fadeIn(250)
            .fadeOut(750)
            .opacity(0.85)
            .zIndex(1);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {opacity: 0.35, duration: 1500, fadeOut: 500, playIf: shake});
    await sequence.play();
}
export const heatMetal = {
    name: 'CHRISPREMADES.Animations.HeatMetal',
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
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
