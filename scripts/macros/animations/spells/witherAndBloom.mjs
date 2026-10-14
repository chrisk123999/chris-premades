import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, addImpact, partOption} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        cast: 'jb2a.cast_generic.01.dark_purple.0',
        area: 'jb2a.explosion.04.dark_purple',
        impact: 'dark_purple',
        bloom: 'jb2a.plant_growth.04.ring.4x4.complete.greenwhite',
        heal: 'jb2a.healing_generic.burst.greenorange'
    },
    free: {
        cast: 'jb2a.cast_generic.earth.01.browngreen.0',
        area: 'jb2a.explosion.02.blue',
        impact: 'blue',
        heal: 'jb2a.on_token_buff.001.001.orangeyellow'
    }
};
async function play(sourceToken, region, {cast = true, impact = true, targets = [], radius} = {}) {
    const files = palettes[animationUtils.jb2aCheck()];
    if (!files) return;
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, geometry.center, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.area)
            .atLocation(geometry.center)
            .size(geometry.size)
            .zIndex(1);
    /* eslint-enable indent */
    if (impact) {
        sequence.wait(500);
        targets.filter(target => target.saved === false).forEach(target => addImpact(sequence, target.token, files.impact));
    }
    await sequence.play();
}
async function heal(targetToken) {
    const files = palettes[animationUtils.jb2aCheck()];
    if (!files) return;
    const sequence = new Sequence();
    if (files.bloom) sequence.effect().file(files.bloom).atLocation(targetToken).scaleToObject(2).belowTokens().fadeOut(1000);
    sequence.effect().file(files.heal).attachTo(targetToken).scaleToObject(1.5).zIndex(2);
    await sequence.play();
}
export const witherAndBloom = {
    name: 'CHRISPREMADES.Animations.WitherAndBloom',
    macros: {
        play,
        heal
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast'),
            impact: partOption('Impact')
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
