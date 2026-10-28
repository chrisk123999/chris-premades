import {animationUtils, automationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, casts, colorOption, endPersist, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple'
};
const glowColors = {
    blue: 0x2eb9dc,
    green: 0xd3eb6a,
    purple: 0xcb40f2
};
const castColors = {
    blue: 'blue',
    green: 'green',
    purple: 'dark_purple'
};
const palettes = {
    patreon: Object.fromEntries(Object.keys(colorMap).map(color => [color, {
        color,
        flame: 'jb2a.sacred_flame.target.' + color,
        impact: 'jb2a.impact.010.' + color,
        pulse: 'jb2a.hunters_mark.pulse.01.' + color,
        fireflies: 'jb2a.fireflies.{{amount}}.02.' + color,
        motes: 'jb2a.fireflies.many.01.' + color
    }])),
    free: {
        green: {
            color: 'green',
            pulse: 'jb2a.hunters_mark.pulse.01.green',
            fireflies: 'jb2a.fireflies.{{amount}}.02.green',
            motes: 'jb2a.fireflies.many.01.green'
        }
    }
};
function getItemColor(activity) {
    if (!activity?.item) return;
    const {animation, options} = automationUtils.getResolvedAnimation(activity.item, 'areaAnimation', {source: 'chris-premades', identifier: 'spellAnimation'});
    if (animation?.macros.create === create) return options.color;
}
function addFlames(sequence, center, file) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file(file)
            .atLocation(center)
            .scale(0.25)
            .duration(1000)
            .scaleOut(0.5, 1000, {ease: 'easeOutBack'})
            .belowTokens()
            .opacity(0.75)
        .effect()
            .file(file)
            .atLocation(center)
            .scale(0.25)
            .duration(1000)
            .scaleIn(0, 1000, {ease: 'easeOutCubic'})
            .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
            .waitUntilFinished(-200);
    /* eslint-enable indent */
}
async function play(sourceToken, region, {color = 'blue', cast = true, radius} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, geometry.center, {file: getPalette(casts, castColors[files.color]), wait: -750});
    if (files.flame) addFlames(sequence, geometry.center, files.flame);
    if (files.impact) {
        /* eslint-disable indent */
        sequence
            .effect()
                .file(files.impact)
                .atLocation(geometry.center, {offset: {y: -0.25}, gridUnits: true})
                .size(geometry.size * 0.45)
                .randomRotation()
                .zIndex(1);
        /* eslint-enable indent */
    }
    /* eslint-disable indent */
    await sequence
        .effect()
            .file(files.pulse)
            .atLocation(geometry.center)
            .size(geometry.size * 1.25)
            .fadeOut(250)
            .belowTokens()
        .effect()
            .file(files.fireflies)
            .setMustache({amount: () => Math.random() < 0.5 ? 'few' : 'many'})
            .atLocation(geometry.center, {randomOffset: 0.75})
            .size(geometry.size * 0.5)
            .randomRotation()
            .duration(750)
            .fadeOut(500)
            .repeats(10, 75, 75)
            .spriteOffset({y: -0.25}, {gridUnits: true})
            .zIndex(1)
        .play();
    /* eslint-enable indent */
}
async function create(effect, targetToken, config, {activity} = {}) {
    const files = getPalette(palettes, getItemColor(activity) ?? config.color);
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name(persistName('faerieFire', effect))
            .copySprite(targetToken)
            .attachTo(targetToken, {bindAlpha: false, bindVisibility: false})
            .belowTokens()
            .scaleToObject(1, {considerTokenScale: true})
            .filter('Glow', {color: glowColors[files.color], distance: 5, outerStrength: 4, innerStrength: 0, knockout: true})
            .fadeIn(500)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(persistName('faerieFire', effect))
            .file(files.motes)
            .attachTo(targetToken)
            .scaleToObject(1.4)
            .randomRotation()
            .fadeIn(500, {delay: 500})
            .fadeOut(1500, {ease: 'easeInSine'})
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const faerieFire = {
    name: 'CHRISPREMADES.Animations.FaerieFire.Name',
    macros: {
        play,
        create,
        delete: endPersist('faerieFire')
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.FaerieFire.ColorHint'}),
            cast: partOption('Cast')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
