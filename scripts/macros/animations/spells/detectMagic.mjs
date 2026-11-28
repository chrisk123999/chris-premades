import {constants} from '../../../proxy.mjs';
import {colorOption, endPersist, getPalette, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    yellow: 'Yellow',
    dark_red: 'DarkRed',
    greenorange: 'GreenOrange',
    grey: 'Grey'
};
const palettes = {
    patreon: Object.fromEntries(Object.keys(colorMap).map(color => [color, 'jb2a.detect_magic.circle.' + color])),
    free: {
        blue: 'jb2a.detect_magic.circle.blue'
    }
};
async function create(effect, targetToken, {color = 'blue', opacity = 1, sound = ''} = {}) {
    const file = getPalette(palettes, color);
    if (!file) return;
    /* eslint-disable indent */
    const sequence = new Sequence()
        .effect()
            .name(persistName('detectMagic', effect))
            .file(file)
            .attachTo(targetToken)
            .opacity(opacity)
            .zIndex(1)
            .fadeIn(250)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect);
    /* eslint-enable indent */
    if (sound) sequence.sound().name(constants.soundName).file(sound);
    await sequence.play();
}
export const detectMagic = {
    name: 'CHRISPREMADES.Animations.DetectMagic.Name',
    macros: {
        create,
        delete: endPersist('detectMagic')
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.DetectMagic.Color.Hint'}),
            opacity: {
                label: 'CHRISPREMADES.Config.Opacity',
                hint: 'CHRISPREMADES.Animations.DetectMagic.Opacity.Hint',
                type: 'number',
                default: 1
            },
            sound: {
                label: 'CHRISPREMADES.Config.Sound.Label',
                hint: 'CHRISPREMADES.Animations.DetectMagic.Sound.Hint',
                type: 'file',
                fileType: 'audio',
                default: ''
            }
        };
    }
};
