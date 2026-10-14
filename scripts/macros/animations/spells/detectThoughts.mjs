import {colorOption, endPersist, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    purple: 'Purple',
    blue: 'Blue',
    dark_red: 'DarkRed'
};
const rune = 'jb2a.magic_signs.rune.divination.complete.blue';
const palettes = {
    patreon: {
        purple: {aura: 'jb2a.detect_magic.circle.purple', beam: 'jb2a.energy_strands.range.standard.purple.01', marker: 'jb2a.energy_strands.02.marker.bluepurple'},
        blue: {aura: 'jb2a.detect_magic.circle.blue', beam: 'jb2a.energy_strands.range.multiple.bluepink.02', marker: 'jb2a.energy_strands.02.marker.bluepurple'},
        dark_red: {aura: 'jb2a.detect_magic.circle.dark_red', beam: 'jb2a.energy_strands.range.multiple.dark_purplered.02', marker: 'jb2a.energy_strands.02.marker.bluepurple'}
    },
    free: {
        purple: {aura: 'jb2a.detect_magic.circle.blue', beam: 'jb2a.energy_strands.range.standard.purple.01', marker: 'jb2a.energy_strands.02.marker.bluepurple'}
    }
};
async function play(sourceToken, targetToken, {color = 'purple', saved} = {}) {
    if (saved === undefined || !sourceToken) return;
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(files.beam)
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .waitUntilFinished(-500)
        .effect()
            .file(files.marker)
            .attachTo(targetToken)
            .scaleToObject(1.5)
            .fadeIn(250)
            .fadeOut(500)
            .duration(2500)
            .playIf(!saved)
        .effect()
            .file('jb2a.extras.tmfx.outpulse.circle.01.normal')
            .atLocation(targetToken)
            .scaleToObject(2)
            .playIf(!!saved)
        .play();
    /* eslint-enable indent */
}
async function create(effect, targetToken, {color = 'purple', opacity = 1, cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(rune)
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .belowTokens()
            .playIf(cast)
            .waitUntilFinished(-1500)
        .effect()
            .name(persistName('detectThoughts', effect))
            .file(files.aura)
            .attachTo(targetToken)
            .opacity(opacity)
            .zIndex(1)
            .fadeIn(250)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const detectThoughts = {
    name: 'CHRISPREMADES.Animations.DetectThoughts.Name',
    macros: {
        play,
        create,
        delete: endPersist('detectThoughts')
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.DetectThoughts.ColorHint'}),
            opacity: {
                label: 'CHRISPREMADES.Config.Opacity',
                hint: 'CHRISPREMADES.Animations.DetectThoughts.OpacityHint',
                type: 'number',
                default: 1
            },
            cast: partOption('Cast')
        };
    }
};
