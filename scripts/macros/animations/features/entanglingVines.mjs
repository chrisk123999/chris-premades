import {addCast, casts, colorOption, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    green: 'Green',
    orange: 'Orange',
    blue: 'DarkBlue',
    purple: 'PinkPurple',
    grey: 'Grey'
};
const palettes = {
    patreon: {
        green: {cast: casts.patreon.green, grow: 'jb2a.entangle.02.complete.02.green', loop: 'jb2a.entangle.02.loop.02.green'},
        orange: {cast: casts.patreon.orange, grow: 'jb2a.entangle.02.complete.03.dark_orange', loop: 'jb2a.entangle.02.loop.03.dark_orange'},
        blue: {cast: casts.patreon.blue, grow: 'jb2a.entangle.02.complete.03.dark_blue', loop: 'jb2a.entangle.02.loop.03.dark_blue'},
        purple: {cast: casts.patreon.dark_purple, grow: 'jb2a.entangle.02.complete.01.dark_pinkpurple', loop: 'jb2a.entangle.02.loop.01.dark_pinkpurple'},
        grey: {cast: casts.patreon.grey, grow: 'jb2a.entangle.02.complete.04.grey', loop: 'jb2a.entangle.02.loop.04.grey'}
    },
    free: {
        green: {cast: casts.free.green, grow: 'jb2a.entangle.02.complete.02.green', loop: 'jb2a.entangle.02.loop.02.green'}
    }
};
function buildGrowth(sourceToken, targetToken, files, {cast}) {
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.grow)
            .atLocation(targetToken)
            .scaleToObject(1.75)
            .playbackRate(1.5)
            .belowTokens()
            .fadeOut(500);
    /* eslint-enable indent */
    return sequence;
}
async function play(sourceToken, targetToken, {color = 'green', cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (files) await buildGrowth(sourceToken, targetToken, files, {cast}).play();
}
async function create(effect, targetToken, {color = 'green', cast = true, persist = true} = {}, {sourceToken} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    const sequence = buildGrowth(sourceToken, targetToken, files, {cast});
    /* eslint-disable indent */
    if (persist) {
        sequence
            .effect()
                .name(persistName('entanglingVines', effect))
                .file(files.loop)
                .attachTo(targetToken)
                .scaleToObject(1.75)
                .belowTokens()
                .delay(1000)
                .fadeIn(500)
                .fadeOut(750)
                .persist()
                .tieToDocuments(effect);
    }
    /* eslint-enable indent */
    await sequence.play();
}
export const entanglingVines = {
    name: 'CHRISPREMADES.Animations.EntanglingVines.Name',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'classFeature',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.EntanglingVines.ColorHint'}),
            cast: partOption('Cast'),
            persist: partOption('Aura', {hint: 'CHRISPREMADES.Animations.SpellParts.PersistentHint'})
        };
    }
};
