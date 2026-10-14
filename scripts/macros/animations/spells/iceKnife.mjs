import {animationUtils} from '../../../proxy.mjs';
import {addCast, addShake, partOption} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        cast: 'jb2a.cast_generic.ice.01.blue',
        impact: 'jb2a.impact_themed.ice_shard.02.blue',
        burst: 'jb2a.ice_spikes.radial.burst.blue',
        snow: 'jb2a.explosion.05.bluewhite'
    },
    free: {
        cast: 'jb2a.cast_generic.02.blue.0',
        impact: 'jb2a.impact_themed.ice_shard.blue',
        burst: 'jb2a.ice_spikes.radial.burst.white'
    }
};
async function play(sourceToken, targetToken, {cast = true, shake = true, hit} = {}) {
    const files = palettes[animationUtils.jb2aCheck()];
    if (!files) return;
    const landed = hit !== false;
    const burstSize = targetToken.width + (5 * 2 / targetToken.parent.grid.distance);
    const sequence = new Sequence();
    if (cast) addCast(sequence, sourceToken, targetToken, {file: files.cast});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.spell_projectile.ice_shard.blue')
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .missed(!landed)
            .zIndex(2)
            .waitUntilFinished(-400)
        .effect()
            .file(files.impact)
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .randomRotation()
            .zIndex(2)
            .playIf(landed)
        .effect()
            .file(files.burst)
            .atLocation(targetToken)
            .size(burstSize, {gridUnits: true})
            .belowTokens()
            .fadeOut(500);
    /* eslint-enable indent */
    if (files.snow) sequence.effect().file(files.snow).atLocation(targetToken).size(burstSize, {gridUnits: true}).zIndex(1);
    addShake(sequence, targetToken, {playIf: shake && landed});
    await sequence.play();
}
export const iceKnife = {
    name: 'CHRISPREMADES.Animations.IceKnife',
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
