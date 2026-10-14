import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, addImpact, casts, getPalette, partOption} from '../generic/spellParts.mjs';
const healFiles = {
    patreon: 'jb2a.healing_generic.burst.yellowwhite',
    free: 'jb2a.healing_generic.200px.yellow'
};
async function play(sourceToken, region, {cast = true, impact = true, allies = [], undead = []} = {}) {
    const tier = animationUtils.jb2aCheck();
    if (!sourceToken || !tier) return;
    const geometry = getAreaGeometry(sourceToken, region);
    const sequence = new Sequence();
    if (cast) addCast(sequence, sourceToken, geometry.center, {file: getPalette(casts, 'yellow'), wait: -750});
    if (geometry.end) {
        /* eslint-disable indent */
        sequence
            .effect()
                .file('jb2a.wind_lines.01.leaves.01.green')
                .atLocation(geometry.origin)
                .stretchTo(geometry.end)
                .opacity(0.9)
                .zIndex(1);
        if (tier === 'patreon') {
            sequence
                .effect()
                    .file('jb2a.breath_weapons02.burst.cone.holy.yellow.01')
                    .atLocation(geometry.origin)
                    .stretchTo(geometry.end)
                    .opacity(0.6)
                    .zIndex(2);
        }
        /* eslint-enable indent */
    }
    if (impact) {
        sequence.wait(500);
        allies.forEach(token => sequence.effect().file(healFiles[tier]).atLocation(token).scaleToObject(1.5).fadeOut(500));
        undead.forEach(token => addImpact(sequence, token, 'yellow'));
    }
    await sequence.play();
}
export const summerWinds = {
    name: 'CHRISPREMADES.Animations.SummerWinds',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        impact: partOption('Impact')
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
