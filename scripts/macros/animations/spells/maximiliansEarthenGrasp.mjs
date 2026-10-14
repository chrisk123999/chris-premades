import {animationUtils} from '../../../proxy.mjs';
import {addShake, partOption} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        impact: 'jb2a.impact.boulder.01'
    },
    free: {
        impact: 'jb2a.impact.ground_crack.orange.02'
    }
};
async function play(sourceToken, targetToken, {shake = true, crush, saved} = {}) {
    const files = palettes[animationUtils.jb2aCheck()];
    if (!files) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.smoke.puff.ring.01.white')
            .atLocation(sourceToken)
            .scaleToObject(1.5)
            .opacity(0.7)
            .belowTokens()
        .effect()
            .file('jb2a.impact.ground_crack.still_frame.01')
            .atLocation(targetToken)
            .scaleToObject(1.75)
            .randomRotation()
            .belowTokens()
            .fadeIn(250)
            .duration(3000)
            .fadeOut(1000)
        .effect()
            .file(files.impact)
            .atLocation(targetToken)
            .scaleToObject(crush ? 1.75 : 1.25)
            .randomRotation()
            .zIndex(1);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {playIf: shake && !saved, duration: crush ? 1500 : 1000});
    await sequence.play();
}
export const maximiliansEarthenGrasp = {
    name: 'CHRISPREMADES.Animations.MaximiliansEarthenGrasp',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            shake: partOption('Shake')
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
