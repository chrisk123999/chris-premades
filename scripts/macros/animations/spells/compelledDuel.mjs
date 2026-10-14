import {addCast, colorOption, getPalette, partOption} from '../generic/spellParts.mjs';
const colorMap = {
    red: 'Red',
    blue: 'Blue',
    purple: 'Purple'
};
const palettes = {
    patreon: {
        red: {cast: 'jb2a.cast_generic.01.dark_red.0', beam: 'jb2a.energy_strands.range.standard.dark_red.01', chains: 'jb2a.markers.chain.standard.loop.02.red'},
        blue: {cast: 'jb2a.cast_generic.01.blue.0', beam: 'jb2a.energy_strands.range.standard.blue.01', chains: 'jb2a.markers.chain.spectral_standard.loop.02.blue'},
        purple: {cast: 'jb2a.cast_generic.01.dark_purple.0', beam: 'jb2a.energy_strands.range.standard.dark_purple.01', chains: 'jb2a.markers.chain.spectral_standard.loop.02.purple'}
    },
    free: {
        red: {cast: 'jb2a.cast_generic.fire.01.orange.0', beam: 'jb2a.energy_strands.range.standard.purple.01', chains: 'jb2a.markers.chain.standard.loop.02.red'},
        blue: {cast: 'jb2a.cast_generic.02.blue.0', beam: 'jb2a.energy_strands.range.standard.purple.01', chains: 'jb2a.markers.chain.spectral_standard.loop.02.blue'}
    }
};
async function play(sourceToken, targetToken, {saved, color = 'red', cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (!files || !sourceToken) return;
    const sequence = new Sequence();
    if (cast) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.beam)
            .attachTo(sourceToken)
            .stretchTo(targetToken, {attachTo: true})
            .scaleIn(0, 750, {ease: 'easeOutQuint'})
            .opacity(saved ? 0.6 : 1)
            .zIndex(2);
    /* eslint-enable indent */
    await sequence.play();
}
async function create(effect, targetToken, {color = 'red'} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name('compelledDuel ' + effect.uuid)
            .file(files.chains)
            .attachTo(targetToken)
            .scaleToObject(1.5)
            .delay(1000)
            .fadeIn(750)
            .fadeOut(500)
            .opacity(0.8)
            .zIndex(1)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const compelledDuel = {
    name: 'CHRISPREMADES.Animations.CompelledDuel',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.CompelledDuelColorHint'}),
            cast: partOption('Cast')
        };
    }
};
