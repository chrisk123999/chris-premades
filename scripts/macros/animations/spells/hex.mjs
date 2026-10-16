import {animationUtils} from '../../../proxy.mjs';
import {pickFile} from '../generic/spellParts.mjs';
// Rising particles and a watching eye over the target, shared by the curse and its damage.
function addCurse(sequence, targetToken) {
    const hasAse = animationUtils.aseCheck();
    /* eslint-disable indent */
    sequence
        .effect()
            .file(pickFile('jb2a.particles.outward.purple.01.03', 'jb2a.particles.outward.blue.01.03'))
            .attachTo(targetToken)
            .scale(0.15)
            .duration(1000)
            .fadeOut(500)
            .scaleIn(0, 1000, {ease: 'easeOutCubic'})
            .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 500, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'height', {from: 0, to: 1.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0, to: -1, duration: 1000, gridUnits: true})
            .zIndex(0.2)
        .effect()
            .file('animated-spell-effects-cartoon.misc.all seeing eye')
            .attachTo(targetToken)
            .filter('ColorMatrix', {hue: 182})
            .scaleToObject(0.75)
            .scaleIn(0, 250, {ease: 'easeOutCubic'})
            .zIndex(0.1)
            .playIf(hasAse)
        .effect()
            .file('animated-spell-effects-cartoon.simple.27')
            .attachTo(targetToken)
            .scaleToObject(4)
            .spriteOffset({x: 0.1, y: -0.45}, {gridUnits: true})
            .filter('ColorMatrix', {brightness: -1})
            .playIf(hasAse);
    /* eslint-enable indent */
}
// Curses the target with a dark rune.
async function play(sourceToken, targetToken) {
    const sequence = new Sequence();
    addCurse(sequence, targetToken);
    /* eslint-disable indent */
    await sequence
        .effect()
            .file(pickFile('jb2a.ward.rune.dark_purple.01', 'jb2a.ward.rune.purple.01'))
            .attachTo(targetToken)
            .scaleToObject(1.85)
            .fadeOut(3000)
            .duration(3500)
            .belowTokens()
            .scaleIn(0, 250, {ease: 'easeOutCubic'})
        .play();
    /* eslint-enable indent */
}
// The hexed target shudders as the curse deals its extra damage.
async function damage(targetToken) {
    const sequence = new Sequence();
    addCurse(sequence, targetToken);
    /* eslint-disable indent */
    await sequence
        .effect()
            .copySprite(targetToken)
            .attachTo(targetToken)
            .fadeOut(300)
            .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true})
            .scaleToObject(targetToken.texture.scaleX)
            .duration(500)
            .tint('#dcace3')
            .opacity(0.45)
        .play();
    /* eslint-enable indent */
}
export const hex = {
    name: 'CHRISPREMADES.Animations.Hex',
    macros: {
        play,
        damage
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
