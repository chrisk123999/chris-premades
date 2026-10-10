import {animationUtils} from '../../../proxy.mjs';
import {addCast, addShake, casts, colorOption, getColor, getPalette, impacts, makePreset, partOption, playOnEffect, styleOption} from './spellParts.mjs';
const colorMap = {
    green: 'Green',
    blue: 'Blue',
    grey: 'Grey',
    purple: 'Purple',
    red: 'Red',
    yellow: 'Yellow',
    dark_purple: 'DarkPurple',
    orange: 'Orange',
    pink: 'Pink'
};
const bellCasts = {
    green: 'jb2a.cast_generic.02.green.0',
    blue: 'jb2a.cast_generic.01.blue.0',
    grey: 'jb2a.cast_generic.03.white.0',
    purple: 'jb2a.cast_generic.01.dark_purple.0',
    red: 'jb2a.cast_generic.01.dark_red.0',
    yellow: 'jb2a.cast_generic.01.yellow.0'
};
const palettes = {
    patreon: Object.fromEntries(Object.entries(bellCasts).map(([color, cast]) => [color, {cast, burst: 'jb2a.toll_the_dead.' + color}])),
    free: {
        green: {cast: 'jb2a.cast_generic.earth.01.browngreen.0', burst: 'jb2a.toll_the_dead.green'}
    }
};
const bursts = {
    impact: {scale: 1.5, files: impacts},
    splash: {
        scale: 1.5,
        files: {
            patreon: {
                blue: 'jb2a.liquid.splash.bright_blue',
                green: 'jb2a.liquid.splash.bright_green',
                grey: 'jb2a.liquid.splash.grey',
                orange: 'jb2a.liquid.splash.brown',
                purple: 'jb2a.liquid.splash.bright_purple',
                red: 'jb2a.liquid.splash.red'
            },
            free: {
                blue: 'jb2a.liquid.splash.blue'
            }
        }
    },
    drain: {
        scale: 1.6,
        files: {
            patreon: {
                blue: 'jb2a.energy_strands.in.blue.01',
                green: 'jb2a.energy_strands.in.green.01',
                purple: 'jb2a.energy_strands.in.purple.01',
                red: 'jb2a.energy_strands.in.red.01',
                yellow: 'jb2a.energy_strands.in.yellow.01'
            },
            free: {
                green: 'jb2a.energy_strands.in.green.01'
            }
        }
    }
};
const aseSplashColors = ['blue', 'green', 'purple', 'red', 'yellow'];
async function playAseSplash(sourceToken, targetToken, {color, cast, shake, failed}) {
    const sequence = new Sequence();
    if (cast) addCast(sequence, sourceToken, targetToken, {file: getPalette(casts, color), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('animated-spell-effects-cartoon.cantrips.acid_splash.' + color)
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .zIndex(2)
            .opacity(failed ? 1 : 0.6)
            .waitUntilFinished(-500);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {playIf: shake && failed});
    await sequence.play();
}
async function playBurst(sourceToken, targetToken, {style, color, cast, shake, failed}) {
    if (style === 'splash' && sourceToken && animationUtils.aseCheck() && aseSplashColors.includes(color)) return playAseSplash(sourceToken, targetToken, {color, cast, shake, failed});
    const burst = bursts[style] ?? bursts.impact;
    const file = getPalette(burst.files, color);
    if (!file) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: getPalette(casts, color), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(file)
            .atLocation(targetToken)
            .scaleToObject(burst.scale)
            .zIndex(2)
            .opacity(failed ? 1 : 0.6);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {playIf: shake && failed});
    await sequence.play();
}
async function play(sourceToken, targetToken, {saved, hit, style = 'bell', color = 'auto', cast = true, shake = true, damageType} = {}) {
    color = getColor(color, damageType);
    if (style !== 'bell') return playBurst(sourceToken, targetToken, {style, color, cast, shake, failed: !saved && hit !== false});
    const files = getPalette(palettes, color);
    if (!files) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.burst + '.bell')
            .attachTo(targetToken, {bindRotation: false})
            .scaleToObject(1)
            .spriteOffset({x: 0, y: -0.55}, {gridUnits: true})
            .zIndex(3)
            .fadeIn(500)
            .duration(2000)
            .animateProperty('sprite', 'position.y', {from: -0.25, to: 0, duration: 500, gridUnits: true, ease: 'easeOutCubic'})
            .fadeOut(500)
        .effect()
            .delay(400)
            .file(files.burst + '.shockwave')
            .attachTo(targetToken, {bindRotation: false})
            .scaleToObject(1)
            .spriteOffset({x: 0, y: -0.55}, {gridUnits: true})
            .zIndex(2.5)
            .fadeIn(500)
            .fadeOut(500)
            .opacity(0.8)
        .wait(500)
        .effect()
            .file(files.burst + '.skull_smoke')
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .zIndex(2)
            .playIf(!saved);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {playIf: shake && !saved});
    await sequence.play();
}
export const castBurst = {
    name: 'CHRISPREMADES.Animations.CastBurst',
    macros: {
        play,
        create: playOnEffect(play)
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    get config() {
        return {
            style: styleOption(['bell', 'impact', 'splash', 'drain'], 'bell', 'CHRISPREMADES.Animations.SpellParts.StyleBurstHint'),
            color: colorOption(colorMap, ['green', 'blue', 'orange', 'yellow']),
            cast: partOption('Cast'),
            shake: partOption('Shake')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
export const tollTheDead = makePreset(castBurst, 'CHRISPREMADES.Animations.TollTheDead', {color: 'green'});
