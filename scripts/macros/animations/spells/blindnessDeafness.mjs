import {addCast, addShake, casts, colorOption, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    purple: 'Purple',
    red: 'Red',
    green: 'Green'
};
const palettes = {
    patreon: {
        purple: {cast: casts.patreon.dark_purple, curse: 'jb2a.condition.curse.01.001.purple', pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.fast'},
        red: {cast: casts.patreon.red, curse: 'jb2a.condition.curse.01.001.red', pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.fast'},
        green: {cast: casts.patreon.green, curse: 'jb2a.condition.curse.01.001.green', pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.fast'}
    },
    free: {
        red: {cast: casts.free.pink, curse: 'jb2a.condition.curse.01.001.red', pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.normal'}
    }
};
function buildCurse(sourceToken, targetToken, files, {cast, shake}) {
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
            .zIndex(1)
        .effect()
            .file(files.pulse)
            .atLocation(targetToken)
            .scaleToObject(2);
    /* eslint-enable indent */
    if (shake) addShake(sequence, targetToken, {duration: 1000});
    return sequence;
}
async function play(sourceToken, targetToken, {color = 'purple', cast = true, shake = true} = {}) {
    const files = getPalette(palettes, color);
    if (files) await buildCurse(sourceToken, targetToken, files, {cast, shake}).play();
}
async function create(effect, targetToken, {color = 'purple', cast = true, shake = true, aura = true} = {}, {sourceToken} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    const sequence = buildCurse(sourceToken, targetToken, files, {cast, shake});
    /* eslint-disable indent */
    if (aura && effect.statuses.has('blinded')) {
        sequence
            .effect()
                .name(persistName('blindnessDeafness', effect))
                .file('jb2a.darkness.black')
                .attachTo(targetToken, {offset: {y: -0.25}, gridUnits: true, local: true})
                .scaleToObject(0.9)
                .delay(500)
                .fadeIn(1000)
                .fadeOut(500)
                .opacity(0.6)
                .zIndex(2)
                .persist()
                .tieToDocuments(effect);
    } else if (aura) {
        sequence
            .effect()
                .name(persistName('blindnessDeafness', effect))
                .file(files.pulse)
                .attachTo(targetToken)
                .scaleToObject(1.5)
                .delay(500)
                .fadeIn(1000)
                .fadeOut(500)
                .opacity(0.4)
                .persist()
                .tieToDocuments(effect);
    }
    /* eslint-enable indent */
    await sequence.play();
}
export const blindnessDeafness = {
    name: 'CHRISPREMADES.Animations.BlindnessDeafness',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.BlindnessDeafnessColorHint'}),
            cast: partOption('Cast'),
            shake: partOption('Shake'),
            aura: partOption('Aura', {hint: 'CHRISPREMADES.Animations.SpellParts.PersistentHint'})
        };
    }
};
