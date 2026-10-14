import {animationUtils} from '../../../proxy.mjs';
import {getPalette} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        blue: {
            marker: 'jb2a.markers.light.complete.blue',
            sign: 'jb2a.magic_signs.circle.02.abjuration.loop.blue',
            pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.normal',
            butterflies: 'jb2a.butterflies.single.blue',
            inflow: 'jb2a.extras.tmfx.inflow.circle.03',
            outflow: 'jb2a.extras.tmfx.outflow.circle.02',
            particles: 'jb2a.particles.outward.blue.01.03',
            wardIntro: 'jb2a.bless.200px.intro.blue',
            wardLoop: 'jb2a.bless.200px.loop.blue',
            block: 'jb2a.energy_field.02.above.blue'
        }
    },
    free: {
        blue: {
            marker: 'jb2a.markers.light.complete.blue',
            sign: 'jb2a.magic_signs.circle.02.abjuration.loop.blue',
            pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.normal',
            butterflies: 'jb2a.butterflies.loop.01.bluepurple',
            inflow: 'jb2a.extras.tmfx.inflow.circle.01',
            outflow: 'jb2a.extras.tmfx.outflow.circle.01',
            wardIntro: 'jb2a.markers.bubble.intro.blue',
            wardLoop: 'jb2a.markers.bubble.loop.blue',
            block: 'jb2a.energy_field.02.above.blue'
        }
    }
};
function getName(effect) {
    return 'sanctuary ' + effect.uuid;
}
async function create(effect, targetToken, _config, {sourceToken} = {}) {
    const files = getPalette(palettes, 'blue');
    if (!files) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (sourceToken) {
        sequence
            .effect()
                .file(files.marker)
                .atLocation(sourceToken)
                .scaleToObject(2)
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .belowTokens()
                .fadeOut(2000)
                .duration(5000)
                .zIndex(1)
            .wait(250)
            .effect()
                .file(files.sign)
                .atLocation(sourceToken)
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .loopProperty('sprite', 'rotation', {from: 0, to: -360, duration: 10000})
                .belowTokens()
                .fadeOut(2000)
                .zIndex(0);
    }
    sequence
        .effect()
            .file(files.pulse)
            .atLocation(targetToken)
            .scaleToObject(3.25, {considerTokenScale: true})
            .delay(1200)
        .effect()
            .name(getName(effect))
            .file(files.butterflies)
            .attachTo(targetToken, {bindRotation: false})
            .scaleToObject(2, {considerTokenScale: true})
            .fadeIn(2000)
            .fadeOut(750)
            .zIndex(3)
            .delay(1200)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(getName(effect))
            .file(files.inflow)
            .attachTo(targetToken)
            .scaleToObject(1, {considerTokenScale: true})
            .opacity(0.75)
            .fadeIn(1000)
            .fadeOut(500)
            .zIndex(1)
            .delay(1200)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .file(files.outflow)
            .atLocation(targetToken)
            .scaleToObject(3, {considerTokenScale: true})
            .opacity(0.25)
            .fadeIn(200)
            .fadeOut(500)
            .duration(10000)
            .belowTokens()
            .delay(1200);
    if (files.particles) {
        sequence
            .effect()
                .file(files.particles)
                .atLocation(targetToken)
                .scaleToObject(3, {considerTokenScale: true})
                .opacity(0.25)
                .fadeIn(200, {ease: 'easeInExpo'})
                .fadeOut(500)
                .duration(10000)
                .belowTokens()
                .delay(1200);
    }
    sequence
        .effect()
            .file(files.wardIntro)
            .atLocation(targetToken)
            .scaleToObject(1.5, {considerTokenScale: true})
            .fadeIn(2000)
            .zIndex(0)
            .waitUntilFinished(-500)
        .effect()
            .name(getName(effect))
            .file(files.wardLoop)
            .attachTo(targetToken, {bindRotation: false})
            .scaleToObject(1.5, {considerTokenScale: true})
            .opacity(0.75)
            .fadeOut(500)
            .zIndex(0)
            .persist()
            .tieToDocuments(effect);
    /* eslint-enable indent */
    await sequence.play();
}
async function play(_sourceToken, targetToken) {
    const files = getPalette(palettes, 'blue');
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(files.block)
            .atLocation(targetToken)
            .scaleToObject(1.25)
            .fadeIn(500)
            .fadeOut(500)
            .playbackRate(2)
        .play();
    /* eslint-enable indent */
}
export const sanctuary = {
    name: 'CHRISPREMADES.Animations.Sanctuary',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
