import {automationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, casts, colorOption, endPersist, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple'
};
const particleColors = {
    blue: 'blue',
    green: 'greenyellow',
    purple: 'purple'
};
const palettes = {
    patreon: Object.fromEntries(Object.keys(colorMap).map(color => [color, {
        color,
        cast: casts.patreon[color === 'purple' ? 'dark_purple' : color],
        pulse: 'jb2a.extras.tmfx.outpulse.circle.01.normal',
        particles: 'jb2a.particles.outward.' + particleColors[color] + '.01.03',
        intro: 'jb2a.markers.light.complete.' + color,
        marker: 'jb2a.markers.light.loop.' + color
    }])),
    free: {
        blue: {
            color: 'blue',
            cast: casts.free.blue,
            pulse: 'jb2a.extras.tmfx.outpulse.circle.01.normal',
            marker: 'jb2a.markers.light.loop.blue'
        }
    }
};
function getItemColor(activity) {
    if (!activity?.item) return;
    const {animation, options} = automationUtils.getResolvedAnimation(activity.item, 'animation', {source: 'chris-premades', identifier: 'areaAnimation'});
    if (animation?.macros.create === create) return options.color;
}
async function play(sourceToken, region, {color = 'blue', cast = true, radius} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, geometry.center, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.pulse)
            .atLocation(geometry.center)
            .size(geometry.size)
            .opacity(0.75)
            .belowTokens();
    if (files.particles) {
        sequence
            .effect()
                .file(files.particles)
                .atLocation(geometry.center)
                .size(geometry.size)
                .delay(250)
                .duration(2000)
                .fadeOut(1000)
                .zIndex(1);
    }
    /* eslint-enable indent */
    await sequence.play();
}
async function create(effect, targetToken, config, {activity} = {}) {
    const files = getPalette(palettes, getItemColor(activity) ?? config.color);
    if (!files) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (files.intro) {
        sequence
            .effect()
                .file(files.intro)
                .attachTo(targetToken)
                .scaleToObject(1.5)
                .fadeOut(500);
    }
    await sequence
        .effect()
            .name(persistName('calmEmotions', effect))
            .file(files.marker)
            .attachTo(targetToken)
            .scaleToObject(1.6)
            .opacity(0.6)
            .delay(500)
            .fadeIn(1000)
            .fadeOut(500)
            .belowTokens()
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const calmEmotions = {
    name: 'CHRISPREMADES.Animations.CalmEmotions.Name',
    macros: {
        play,
        create,
        delete: endPersist('calmEmotions')
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.CalmEmotions.ColorHint'}),
            cast: partOption('Cast')
        };
    }
};
