import {addCast, addShake, casts, colorOption, getPalette, partOption} from '../generic/spellParts.mjs';
const colorMap = {
    red: 'Red',
    purple: 'Purple',
    green: 'Green'
};
const palettes = {
    patreon: {
        red: {cast: casts.patreon.red, curse: 'jb2a.condition.curse.01.001.red', crown: 'jb2a.dizzy_stars.400px.red'},
        purple: {cast: casts.patreon.dark_purple, curse: 'jb2a.condition.curse.01.001.purple', crown: 'jb2a.dizzy_stars.400px.purple'},
        green: {cast: casts.patreon.green, curse: 'jb2a.condition.curse.01.001.green', crown: 'jb2a.dizzy_stars.400px.green'}
    },
    free: {
        red: {cast: casts.free.pink, curse: 'jb2a.condition.curse.01.001.red', crown: 'jb2a.condition.curse.01.001.red'}
    }
};
function buildCrown(sourceToken, targetToken, files, {cast, shake}) {
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.curse)
            .atLocation(targetToken)
            .scaleToObject(1.75)
            .scaleIn(0, 750, {ease: 'easeOutQuint'})
            .fadeOut(750)
            .zIndex(1);
    /* eslint-enable indent */
    if (shake) addShake(sequence, targetToken, {duration: 1500});
    return sequence;
}
async function play(sourceToken, targetToken, {color = 'red', cast = true, shake = true} = {}) {
    const files = getPalette(palettes, color);
    if (files) await buildCrown(sourceToken, targetToken, files, {cast, shake}).play();
}
async function create(effect, targetToken, {color = 'red', cast = true, shake = true} = {}, {sourceToken} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await buildCrown(sourceToken, targetToken, files, {cast, shake})
        .effect()
            .name('crownOfMadness ' + effect.uuid)
            .file(files.crown)
            .attachTo(targetToken, {offset: {y: -0.35}, gridUnits: true, local: true})
            .scaleToObject(0.8)
            .delay(750)
            .fadeIn(750)
            .fadeOut(500)
            .opacity(0.85)
            .zIndex(2)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const crownOfMadness = {
    name: 'CHRISPREMADES.Animations.CrownOfMadness',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.CrownOfMadnessColorHint'}),
            cast: partOption('Cast'),
            shake: partOption('Shake')
        };
    }
};
