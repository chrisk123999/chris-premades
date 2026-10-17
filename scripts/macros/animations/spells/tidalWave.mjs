import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addShake, partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true, impact = true, targets = []} = {}) {
    if (!region) return;
    const geometry = getAreaGeometry(sourceToken, region);
    const start = geometry.origin;
    const end = geometry.end ?? geometry.center;
    const hasAse = animationUtils.aseCheck();
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast && sourceToken) {
        sequence
            .effect()
                .file('jb2a.cast_generic.water.02.blue')
                .attachTo(sourceToken)
                .scaleToObject(1.5)
                .waitUntilFinished(-1000);
    }
    sequence
        .effect()
            .file(hasAse ? 'animated-spell-effects-cartoon.mix.water.02' : 'jb2a.water_splash.cone.01.blue')
            .atLocation(start)
            .stretchTo(end)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
            .zIndex(1)
        .canvasPan()
            .delay(500)
            .shake({duration: 1500, strength: 2, rotation: false, fadeOut: 500});
    /* eslint-enable indent */
    if (impact) {
        sequence.wait(750);
        targets.forEach(target => {
            /* eslint-disable indent */
            sequence
                .effect()
                    .file('jb2a.water_splash.circle.01.blue')
                    .atLocation(target.token)
                    .scaleToObject(2)
                    .fadeOut(1000)
                    .belowTokens()
                .effect()
                    .file('jb2a.markers.bubble.02.complete.blue')
                    .attachTo(target.token)
                    .scaleToObject(1)
                    .opacity(0.6)
                    .duration(2500)
                    .fadeIn(500)
                    .fadeOut(1000);
            /* eslint-enable indent */
            addShake(sequence, target.token, {playIf: target.saved !== true});
        });
    }
    await sequence.play();
}
export const tidalWave = {
    name: 'CHRISPREMADES.Animations.TidalWave',
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
