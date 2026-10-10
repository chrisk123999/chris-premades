import {animationUtils} from '../../../proxy.mjs';
const fallbackColors = {
    dark_purple: 'purple',
    dark_red: 'red',
    pink: 'purple',
    purple: 'blue',
    grey: 'blue',
    red: 'orange',
    orange: 'yellow'
};
export const elementColors = {
    acid: 'green',
    bludgeoning: 'grey',
    cold: 'blue',
    fire: 'orange',
    force: 'purple',
    healing: 'yellow',
    lightning: 'blue',
    necrotic: 'dark_purple',
    piercing: 'grey',
    poison: 'green',
    psychic: 'pink',
    radiant: 'yellow',
    slashing: 'grey',
    temphp: 'yellow',
    thunder: 'blue'
};
export const casts = {
    patreon: {
        blue: 'jb2a.cast_generic.01.blue.0',
        dark_purple: 'jb2a.cast_generic.01.dark_purple.0',
        green: 'jb2a.cast_generic.02.green.0',
        grey: 'jb2a.cast_generic.03.white.0',
        orange: 'jb2a.cast_generic.fire.01.orange.0',
        pink: 'jb2a.cast_generic.sound.01.pinkteal.0',
        red: 'jb2a.cast_generic.01.dark_red.0',
        yellow: 'jb2a.cast_generic.01.yellow.0'
    },
    free: {
        blue: 'jb2a.cast_generic.02.blue.0',
        green: 'jb2a.cast_generic.earth.01.browngreen.0',
        orange: 'jb2a.cast_generic.fire.01.orange.0',
        pink: 'jb2a.cast_generic.sound.01.pinkteal.0',
        yellow: 'jb2a.cast_generic.01.yellow.0'
    }
};
export const impacts = {
    patreon: {
        blue: 'jb2a.impact.007.blue',
        green: 'jb2a.impact.007.green',
        grey: 'jb2a.impact.007.white',
        orange: 'jb2a.impact.007.orange',
        pink: 'jb2a.impact.007.pink',
        purple: 'jb2a.impact.007.purple',
        red: 'jb2a.impact.007.red',
        yellow: 'jb2a.impact.007.yellow'
    },
    free: {
        yellow: 'jb2a.impact.007.yellow',
        blue: 'jb2a.impact.004.blue',
        orange: 'jb2a.impact.007.orange'
    }
};
export function getPalette(palettes, color) {
    const tier = animationUtils.jb2aCheck();
    if (!tier) return;
    const palette = palettes[tier];
    let key = color;
    while (key && !palette[key]) key = fallbackColors[key];
    return palette[key] ?? Object.values(palette)[0];
}
export function getColor(color, damageType) {
    return color === 'auto' ? elementColors[damageType] : color;
}
export function colorOption(colorMap, freeColors, {auto = true, random, hint = 'CHRISPREMADES.Animations.SpellParts.ColorHint'} = {}) {
    const options = animationUtils.buildColorOptions(colorMap, {
        freeColors,
        requirements: ['jb2a_patreon'],
        labelPrefix: 'CHRISPREMADES.Config.Colors.',
        random
    });
    return {
        default: auto ? 'auto' : Object.keys(colorMap)[0],
        type: 'select',
        label: 'CHRISPREMADES.Config.Color',
        hint,
        options: auto ? {auto: {label: 'CHRISPREMADES.Config.Colors.Auto'}, ...options} : options
    };
}
export function partOption(part, {defaultValue = true, hint = 'CHRISPREMADES.Animations.SpellParts.' + part + 'Hint'} = {}) {
    return {
        default: defaultValue,
        type: 'checkbox',
        label: 'CHRISPREMADES.Animations.SpellParts.' + part,
        hint
    };
}
export function styleOption(styles, defaultStyle, hint) {
    return {
        default: defaultStyle,
        type: 'select',
        label: 'CHRISPREMADES.Animations.SpellParts.Style',
        hint,
        options: Object.fromEntries(styles.map(style => [style, {label: 'CHRISPREMADES.Animations.SpellParts.Styles.' + style.capitalize()}]))
    };
}
export function addCast(sequence, sourceToken, targetToken, {file, side, wait}) {
    const section = sequence.effect().file(file).attachTo(sourceToken).scaleToObject(side ? 1 : 1.5);
    if (side) section.rotateTowards(targetToken);
    if (wait !== undefined) section.waitUntilFinished(wait);
}
export function playOnEffect(play) {
    return (effect, token, config, {sourceToken, activity} = {}) => play(sourceToken, token, {damageType: activity?.damage?.parts?.[0]?.types?.first(), ...config});
}
export function addShake(sequence, token, {opacity = 0.5, duration = 1000, fadeIn = 0, fadeOut = 250, playIf = true} = {}) {
    /* eslint-disable indent */
    sequence
        .effect()
            .copySprite(token)
            .attachTo(token)
            .scaleToObject(1, {considerTokenScale: true})
            .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .opacity(opacity)
            .duration(duration)
            .fadeIn(fadeIn)
            .fadeOut(fadeOut)
            .playIf(playIf);
    /* eslint-enable indent */
}
export function addImpact(sequence, targetToken, color, {scale = 1, playIf = true} = {}) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file(getPalette(impacts, color))
            .atLocation(targetToken)
            .scaleToObject(scale)
            .randomRotation()
            .zIndex(1)
            .playIf(playIf);
    /* eslint-enable indent */
}
export async function slideWithCopy(targetToken, move, {travel} = {}) {
    if (targetToken.width > 2) return move();
    const origin = targetToken.getCenterPoint();
    /* eslint-disable indent */
    await new Sequence()
        .animation()
            .on(targetToken)
            .opacity(0)
        .play();
    await move();
    const destination = targetToken.getCenterPoint();
    const gridSize = targetToken.parent.grid.size;
    const sequence = new Sequence();
    if (travel) travel(sequence, origin, destination);
    await sequence
        .effect()
            .copySprite(targetToken)
            .atLocation(origin)
            .zIndex(0)
            .animateProperty('spriteContainer', 'position.x', {from: 0, to: (destination.x - origin.x) / gridSize, duration: 500, gridUnits: true, ease: 'easeInCubic'})
            .animateProperty('spriteContainer', 'position.y', {from: 0, to: (destination.y - origin.y) / gridSize, duration: 500, gridUnits: true, ease: 'easeInCubic'})
            .duration(600)
            .waitUntilFinished(-100)
        .play();
    await targetToken.object?.movementAnimationPromise;
    await new Sequence()
        .animation()
            .on(targetToken)
            .opacity(1)
        .play();
    /* eslint-enable indent */
}
export function makePreset(generic, name, defaults) {
    return {
        name,
        macros: generic.macros,
        inputs: generic.inputs,
        requirements: generic.requirements,
        category: 'spell',
        get config() {
            if (!this._config) {
                this._config = generic.config;
                Object.entries(defaults).forEach(([key, value]) => this._config[key].default = value);
            }
            return this._config;
        },
        get credits() { return generic.credits; }
    };
}
