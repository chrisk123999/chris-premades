import {animationUtils} from '../../../proxy.mjs';
import {addCast, addImpact, addShake, casts, colorOption, getColor, getPalette, makePreset, partOption, playOnEffect, styleOption} from './spellParts.mjs';
const colorMap = {
    blue: 'Blue',
    blue02: 'Blue02',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    green: 'Green',
    green02: 'Green02',
    grey: 'Grey',
    orange: 'Orange',
    pink: 'Pink',
    purple: 'Purple',
    red: 'Red',
    yellow: 'Yellow'
};
const lightningColors = ['blue', 'blue02', 'dark_purple', 'dark_red', 'green', 'green02', 'orange', 'purple', 'red', 'yellow'];
const strikes = {
    patreon: {
        blue: 'jb2a.unarmed_strike.magical.01.blue',
        dark_purple: 'jb2a.unarmed_strike.magical.01.dark_purple',
        dark_red: 'jb2a.unarmed_strike.magical.01.dark_red',
        green: 'jb2a.unarmed_strike.magical.01.green',
        orange: 'jb2a.unarmed_strike.magical.01.orange',
        pink: 'jb2a.unarmed_strike.magical.01.pinkpurple',
        purple: 'jb2a.unarmed_strike.magical.01.pinkpurple',
        yellow: 'jb2a.unarmed_strike.magical.01.yellow'
    },
    free: {
        blue: 'jb2a.unarmed_strike.magical.01.blue'
    }
};
const arcColors = {blue: ['blue', 'blue'], blue02: ['blue', 'blue'], dark_purple: ['purple', 'purple'], dark_red: ['orange', 'red'], green: ['green', 'green'], green02: ['green', 'green'], orange: ['orange', 'orange'], purple: ['purple', 'purple'], red: ['orange', 'red'], yellow: ['orange', 'orange']};
function getDetailedFiles(tier, color) {
    if (tier === 'free') return {line: 'jb2a.breath_weapons.lightning.line.blue', side: 'jb2a.impact.002.blue', arc: 'jb2a.electric_arc.01', static: 'jb2a.static_electricity.03.blue'};
    return {
        line: 'jb2a.breath_weapons.lightning.line.' + arcColors[color][0],
        side: 'jb2a.impact.008.' + arcColors[color][1],
        arc: ['blue', 'blue02'].includes(color) ? 'jb2a.electric_arc.' + color + '.01' : undefined,
        static: 'jb2a.static_electricity.03.' + color
    };
}
function addCasterArcs(sequence, sourceToken, targetToken, files) {
    const width = sourceToken.width;
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.line)
            .atLocation(sourceToken)
            .rotateTowards(targetToken)
            .spriteOffset({x: width * 0.4}, {gridUnits: true})
            .scale(0.25)
            .endTime(4000)
            .playbackRate(3)
            .animateProperty('sprite', 'position.x', {from: -0.3, to: 0, duration: 750, gridUnits: true, ease: 'easeInBack'})
            .waitUntilFinished(-300)
        .effect()
            .delay(250)
            .file(files.side)
            .atLocation(sourceToken)
            .rotateTowards(targetToken)
            .spriteOffset({x: width - 1}, {gridUnits: true})
            .scale(0.25);
    if (files.arc) {
        [false, true].forEach(mirrored => {
            sequence
                .effect()
                    .delay(mirrored ? 250 : 0)
                    .file(files.arc)
                    .atLocation(sourceToken)
                    .rotateTowards(targetToken)
                    .size(width * 1.2, {gridUnits: true})
                    .spriteOffset({x: width * 0.35}, {gridUnits: true})
                    .mirrorY(mirrored)
                    .zIndex(1)
                    .repeats(2, 500, 500);
        });
    }
    sequence.wait(250);
    /* eslint-enable indent */
}
async function playDetailed(sourceToken, targetToken, files, shake, landed) {
    const sequence = new Sequence();
    if (sourceToken) addCasterArcs(sequence, sourceToken, targetToken, files);
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.static)
            .attachTo(targetToken)
            .scaleToObject(1.25)
            .fadeOut(1000)
            .randomRotation()
            .repeats(3, 300, 300)
            .playIf(landed);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {opacity: 0.25, duration: 4000, fadeIn: 250, fadeOut: 1500, playIf: shake && landed});
    await sequence.play({preload: true});
}
async function playStrike(sourceToken, targetToken, {color, cast, shake, hit}) {
    const landed = hit !== false;
    const sequence = new Sequence();
    if (sourceToken) {
        if (cast) addCast(sequence, sourceToken, targetToken, {file: getPalette(casts, color), wait: -750});
        /* eslint-disable indent */
        sequence
            .effect()
                .file(getPalette(strikes, color))
                .atLocation(sourceToken)
                .stretchTo(targetToken)
                .zIndex(2)
                .waitUntilFinished(-600);
        /* eslint-enable indent */
    }
    addImpact(sequence, targetToken, color, {scale: 1.2, playIf: landed});
    addShake(sequence, targetToken, {playIf: shake && landed});
    await sequence.play();
}
async function play(sourceToken, targetToken, {style = 'lightning', color = 'auto', detailed = true, cast = true, shake = true, damageType, hit} = {}) {
    const tier = animationUtils.jb2aCheck();
    if (!tier) return;
    color = getColor(color, damageType ?? 'lightning');
    if (color === 'random') color = lightningColors[Math.floor(Math.random() * lightningColors.length)];
    if (style === 'strike') return playStrike(sourceToken, targetToken, {color, cast, shake, hit});
    if (tier === 'free' || !lightningColors.includes(color)) color = 'blue';
    const landed = hit !== false;
    if (detailed) return playDetailed(sourceToken, targetToken, getDetailedFiles(tier, color), shake, landed);
    if (!landed) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.static_electricity.01.' + color)
            .scaleToObject(1.2)
            .atLocation(targetToken)
            .waitUntilFinished(-1000)
        .effect()
            .file('jb2a.impact.011.' + color)
            .scaleToObject(1.9)
            .atLocation(targetToken)
        .play();
    /* eslint-enable indent */
}
export const castTouch = {
    name: 'CHRISPREMADES.Animations.CastTouch',
    macros: {
        play,
        create: playOnEffect(play)
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    get config() {
        return {
            style: styleOption(['lightning', 'strike'], 'lightning', 'CHRISPREMADES.Animations.SpellParts.StyleTouchHint'),
            color: colorOption(colorMap, ['blue'], {random: true}),
            cast: partOption('Cast'),
            detailed: partOption('Detailed'),
            shake: partOption('Shake')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
export const shockingGrasp = makePreset(castTouch, 'CHRISPREMADES.Animations.ShockingGrasp', {color: 'blue'});
