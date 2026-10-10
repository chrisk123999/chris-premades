import {animationUtils, tokenUtils} from '../../../proxy.mjs';
import {addCast, addImpact, addShake, casts, colorOption, getColor, getPalette, partOption, playOnEffect, slideWithCopy, styleOption} from './spellParts.mjs';
const colorMap = {
    purple: 'Purple',
    green: 'Green',
    blue: 'Blue',
    red: 'Red',
    orange: 'Orange',
    dark_purple: 'DarkPurple',
    grey: 'Grey',
    pink: 'Pink',
    yellow: 'Yellow'
};
const palettes = {
    patreon: {
        purple: {cast: 'jb2a.cast_generic.01.dark_purple.0', beam: 'jb2a.energy_strands.range.standard.dark_purple.01', impact: 'jb2a.impact.purple.0'},
        green: {cast: 'jb2a.cast_generic.earth.side01.browngreen.0', side: true, beam: 'jb2a.energy_strands.range.standard.dark_green.01', impact: 'jb2a.impact.green.0'},
        blue: {cast: 'jb2a.cast_generic.01.blue.0', beam: 'jb2a.energy_strands.range.standard.blue.01', impact: 'jb2a.impact.blue.0'},
        red: {cast: 'jb2a.cast_generic.01.dark_red.0', beam: 'jb2a.energy_strands.range.standard.dark_red.01', impact: 'jb2a.impact.red.0'},
        orange: {cast: 'jb2a.cast_generic.fire.side01.orange.0', side: true, beam: 'jb2a.energy_strands.range.standard.orange.01', impact: 'jb2a.impact.orange.0'}
    },
    free: {
        purple: {cast: 'jb2a.cast_generic.02.blue.0', beam: 'jb2a.energy_strands.range.standard.purple.01', impact: 'jb2a.impact.blue.0'}
    }
};
const projectiles = {
    patreon: {
        blue: 'jb2a.ranged.04.projectile.01.blue',
        dark_purple: 'jb2a.ranged.01.projectile.01.dark_purple',
        green: 'jb2a.ranged.04.projectile.01.green',
        grey: 'jb2a.bolt.physical.white',
        orange: 'jb2a.ranged.04.projectile.01.orange',
        pink: 'jb2a.ranged.03.projectile.01.pinkpurple',
        purple: 'jb2a.ranged.04.projectile.01.purple',
        red: 'jb2a.ranged.01.projectile.01.dark_orange',
        yellow: 'jb2a.ranged.02.projectile.01.yellow'
    },
    free: {
        green: 'jb2a.ranged.04.projectile.01.green',
        blue: 'jb2a.ranged.03.projectile.01.bluegreen',
        orange: 'jb2a.ranged.01.projectile.01.dark_orange',
        yellow: 'jb2a.ranged.02.projectile.01.yellow'
    }
};
const aseLightning = {
    ase: true,
    beam: 'animated-spell-effects-cartoon.electricity.discharge.03',
    travel: 'animated-spell-effects-cartoon.electricity.25',
    travelScale: 2,
    impact: 'animated-spell-effects-cartoon.electricity.19',
    impactScale: 2
};
function jb2aLightning(color) {
    return {
        color,
        beam: 'jb2a.chain_lightning.primary.' + color,
        travel: 'jb2a.static_electricity.03.' + color,
        travelScale: 1.25,
        impact: 'jb2a.impact.011.' + color,
        impactScale: 1.5
    };
}
const lightnings = {
    patreon: {
        blue: jb2aLightning('blue'),
        dark_purple: jb2aLightning('dark_purple'),
        green: jb2aLightning('green'),
        orange: jb2aLightning('orange'),
        purple: jb2aLightning('purple'),
        red: jb2aLightning('red'),
        yellow: jb2aLightning('yellow')
    },
    free: {
        blue: jb2aLightning('blue')
    }
};
function getFiles(style, color) {
    if (style === 'lightning') {
        const files = getPalette(lightnings, color);
        if (!files) return;
        return {cast: getPalette(casts, color), ...(files.color === 'blue' && animationUtils.aseCheck() ? aseLightning : files)};
    }
    if (style !== 'projectile') return getPalette(palettes, color);
    const beam = getPalette(projectiles, color);
    if (!beam) return;
    return {cast: getPalette(casts, color), beam};
}
function addTravel(sequence, targetToken, files) {
    const section = sequence.effect().file(files.travel).size(files.travelScale * targetToken.width, {gridUnits: true}).zIndex(2);
    if (files.ase) section.spriteRotation(90).mirrorX();
    else section.randomRotation();
    return section;
}
async function pull(targetToken, move, {copySlide, files} = {}) {
    if (copySlide) {
        const travel = files ? (sequence, origin, destination) => addTravel(sequence, targetToken, files).atLocation(origin).moveTowards(destination, {ease: 'easeInOutBack', rotate: false}) : undefined;
        await slideWithCopy(targetToken, move, {travel});
        return;
    }
    if (files) {
        const sequence = new Sequence();
        addTravel(sequence, targetToken, files).attachTo(targetToken);
        sequence.play();
    }
    await move();
    await targetToken.object?.movementAnimationPromise;
}
async function playLightning(sourceToken, targetToken, files, {move, cast, shake, copySlide, landed}) {
    const tether = sourceToken && landed && move;
    const name = 'Cast Beam Tether ' + targetToken.id;
    if (sourceToken) {
        const sequence = new Sequence();
        if (cast) addCast(sequence, sourceToken, targetToken, {file: files.cast});
        const beam = sequence.effect().file(files.beam).attachTo(sourceToken).stretchTo(targetToken, {attachTo: true}).missed(!landed).scaleIn(0, 750, {ease: 'easeOutQuint'}).zIndex(2);
        if (tether) beam.persist().name(name);
        else beam.repeats(2, 600, 600);
        await sequence.wait(tether ? 750 : 250).play();
    }
    if (!landed) return move?.();
    if (move) {
        await pull(targetToken, move, {copySlide, files});
        if (tether) await Sequencer.EffectManager.endEffects({name});
    } else {
        const travel = new Sequence();
        addTravel(travel, targetToken, files).attachTo(targetToken);
        await travel.play();
    }
    if (!sourceToken || tokenUtils.getDistance(sourceToken, targetToken) > 5) return;
    const impact = new Sequence();
    /* eslint-disable indent */
    impact
        .effect()
            .file(files.impact)
            .atLocation(sourceToken)
            .scaleToObject(files.impactScale)
            .rotateTowards(targetToken)
            .zIndex(0.2);
    /* eslint-enable indent */
    addShake(impact, targetToken, {playIf: shake});
    await impact.play();
}
async function play(sourceToken, targetToken, {move, style = 'strands', color = 'auto', cast = true, shake = true, copySlide = false, damageType, hit} = {}) {
    color = getColor(color, damageType);
    const files = getFiles(style, color);
    if (!files) return move?.();
    const landed = hit !== false;
    if (style === 'lightning') return playLightning(sourceToken, targetToken, files, {move, cast, shake, copySlide, landed});
    const sequence = new Sequence();
    const tether = sourceToken && landed && move && style === 'strands';
    const name = 'Cast Beam Tether ' + targetToken.id;
    if (sourceToken) {
        if (cast) addCast(sequence, sourceToken, targetToken, {file: files.cast, side: files.side});
        const beam = sequence.effect().file(files.beam).attachTo(sourceToken).stretchTo(targetToken, {attachTo: !!tether}).missed(!landed).zIndex(2);
        if (tether) {
            beam.persist().name(name);
            sequence.wait(750);
        } else beam.waitUntilFinished(style === 'projectile' ? -500 : -1000);
    }
    if (files.impact) sequence.effect().file(files.impact).atLocation(targetToken).scaleToObject(1).zIndex(1).randomRotation().playIf(landed);
    else addImpact(sequence, targetToken, color, {playIf: landed});
    addShake(sequence, targetToken, {playIf: shake && landed});
    await sequence.wait(100).play();
    if (!move) return;
    await pull(targetToken, move, {copySlide});
    if (tether) await Sequencer.EffectManager.endEffects({name});
}
export const castBeam = {
    name: 'CHRISPREMADES.Animations.CastBeam',
    macros: {
        play,
        create: playOnEffect(play)
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    get config() {
        return {
            style: styleOption(['strands', 'projectile', 'lightning'], 'strands', 'CHRISPREMADES.Animations.SpellParts.StyleBeamHint'),
            color: colorOption(colorMap, ['purple', 'green', 'blue', 'orange', 'yellow']),
            cast: partOption('Cast'),
            shake: partOption('Shake'),
            copySlide: partOption('CopySlide', {defaultValue: false})
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
