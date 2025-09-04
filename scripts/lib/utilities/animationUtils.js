import {summonEffects} from '../../macros/animations/summonEffects.js';
import {teleportEffects} from '../../macros/animations/teleportEffects.js';
import {animations, colors, defaultMatrix} from '../../macros/animations/colorMatrix.js';
import {genericUtils} from './genericUtils.js';
function jb2aCheck() {
    let patreon = game.modules.get('jb2a_patreon')?.active;
    let free = game.modules.get('JB2A_DnD5e')?.active;
    if (patreon && free) {
        genericUtils.notify('CHRISPREMADES.Troubleshooter.BothJB2A', 'warn', {localize: true});
        return 'patreon';
    }
    if (patreon) return 'patreon';
    if (free) return 'free';
    genericUtils.notify('CHRISPREMADES.Troubleshooter.MissingJB2A', 'warn', {localize: true});
    return false;
}
function aseCheck() {
    let isActive = game.modules.get('animated-spell-effects-cartoon')?.active;
    return isActive;
}
function simpleAttack(sourceToken, targetToken, animation, {sound, missed} = {missed: false}) {
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .file(animation)
            .missed(missed)
        .sound()
            .playIf(sound)
            .file(sound)
        .play();
    /* eslint-enable indent */
}
/**
 * @param {string} animation JB2A animation database path
 * @param {string} color Damage types and spell school abbrevs
 * @returns {ColorMatrix} to be used in a Sequence as .filter('ColorMatrix', animationUtils.colorMatrix(animation, color))
 */
function colorMatrix(animation, color) {
    if (!Object.keys(animations).includes(animation)) return defaultMatrix;
    if (!Object.keys(colors).includes(color)) return defaultMatrix;
    let matrix = {
        brightness: colors[color].brightness + 1,
        saturate: colors[color].saturate - animations[animation].saturate,
        hue: colors[color].hue - animations[animation].hue
    };
    return matrix;
}
export let animationUtils = {
    jb2aCheck,
    aseCheck,
    simpleAttack,
    summonEffects,
    teleportEffects,
    colorMatrix
};