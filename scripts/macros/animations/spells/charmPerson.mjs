import {animationUtils} from '../../../proxy.mjs';
import {addCast, casts, colorOption, getPalette, partOption} from '../generic/spellParts.mjs';
const colorMap = {
    pink: 'Pink',
    dark_red: 'DarkRed',
    teal: 'Teal'
};
const castFiles = {
    pink: casts.patreon.pink,
    dark_red: casts.patreon.red,
    teal: casts.patreon.pink
};
const palettes = {
    patreon: Object.fromEntries(Object.keys(colorMap).map(color => [color, {
        cast: castFiles[color],
        circle: 'jb2a.template_circle.symbol.out_flow.heart.' + color,
        icon: 'jb2a.icon.heart.' + color,
        pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.fast',
        marker: 'jb2a.markers.heart.' + color + '.03'
    }])),
    free: {
        pink: {
            cast: casts.free.pink,
            circle: 'jb2a.template_circle.symbol.normal.heart.pink',
            icon: 'jb2a.icon.heart.pink',
            pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.normal',
            marker: 'jb2a.markers.heart.pink.03'
        }
    }
};
function getName(effect) {
    return 'charmPerson ' + effect.uuid;
}
function buildCharm(sourceToken, targetToken, files, cast) {
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.circle)
            .atLocation(targetToken)
            .scaleToObject(3)
            .scaleIn(0, 1000, {ease: 'easeOutQuint'})
            .belowTokens()
            .duration(3000)
            .fadeOut(2000)
        .effect()
            .file(files.icon)
            .attachTo(targetToken)
            .scaleToObject(1)
            .scaleIn(0, 500, {ease: 'easeOutQuint'})
            .duration(2000)
            .fadeOut(1000)
        .effect()
            .file(files.icon)
            .attachTo(targetToken)
            .scaleToObject(3)
            .anchor({y: 0.45})
            .scaleIn(0, 500, {ease: 'easeOutQuint'})
            .duration(1000)
            .fadeOut(1000)
            .opacity(0.5)
        .effect()
            .file(files.pulse)
            .atLocation(targetToken)
            .scaleToObject(2);
    /* eslint-enable indent */
    return sequence;
}
async function play(sourceToken, targetToken, {color = 'pink', cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (files) await buildCharm(sourceToken, targetToken, files, cast).play();
}
async function create(effect, targetToken, {color = 'pink', cast = true} = {}, {sourceToken} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await buildCharm(sourceToken, targetToken, files, cast)
        .effect()
            .name(getName(effect))
            .file(files.marker)
            .attachTo(targetToken)
            .scaleToObject(2)
            .delay(500)
            .fadeIn(1000)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const charmPerson = {
    name: 'CHRISPREMADES.Animations.CharmPerson',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.CharmPersonColorHint'}),
            cast: partOption('Cast')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
