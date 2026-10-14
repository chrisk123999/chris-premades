import {animationUtils} from '../../../proxy.mjs';
import {addCast, partOption} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        marker: 'jb2a.markers.light.complete.yellow',
        sign: 'jb2a.magic_signs.circle.02.evocation.loop.yellow',
        bolt: 'jb2a.guiding_bolt.01.yellow',
        glow: 'jb2a.markers.light.loop.yellow',
        particles: 'jb2a.particles.outward.orange.02.03'
    },
    free: {
        cast: 'jb2a.cast_generic.01.yellow.0',
        bolt: 'jb2a.guiding_bolt.01.blueyellow',
        glow: 'jb2a.glint.yellow.many'
    }
};
async function play(sourceToken, targetToken, {cast = true, hit} = {}) {
    const files = palettes[animationUtils.jb2aCheck()];
    if (!files || !sourceToken) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast && files.marker) {
        sequence
            .effect()
                .file(files.marker)
                .atLocation(sourceToken)
                .scaleToObject(2)
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .belowTokens()
                .fadeOut(2000)
                .duration(5000)
                .zIndex(0)
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
    if (cast && files.cast) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    sequence
        .effect()
            .file(files.bolt)
            .attachTo(sourceToken)
            .stretchTo(targetToken, {attachTo: true})
            .missed(hit === false)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .zIndex(2);
    /* eslint-enable indent */
    await sequence.play();
}
async function create(effect, targetToken) {
    const files = palettes[animationUtils.jb2aCheck()];
    if (!files) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.glow)
            .attachTo(targetToken)
            .scaleToObject(1.5, {considerTokenScale: true})
            .delay(1500)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
            .persist()
            .tieToDocuments(effect);
    if (files.particles) {
        sequence
            .effect()
                .file(files.particles)
                .attachTo(targetToken)
                .scaleToObject(1.5, {considerTokenScale: true})
                .scaleIn(0, 500, {ease: 'easeOutCirc'})
                .delay(1500)
                .fadeIn(1000)
                .fadeOut(500)
                .randomRotation()
                .mask(targetToken)
                .zIndex(1)
                .persist()
                .tieToDocuments(effect);
    }
    /* eslint-enable indent */
    await sequence.play();
}
export const guidingBolt = {
    name: 'CHRISPREMADES.Animations.GuidingBolt',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
