import {animationUtils} from '../../../proxy.mjs';
function addCrack(sequence, token) {
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.ground_crack.blue.01')
            .atLocation(token, {cacheLocation: true})
            .size(3, {gridUnits: true})
            .belowTokens()
            .zIndex(1)
            .playIf(isPatreon)
        .effect()
            .file('jb2a.impact.ground_crack.still_frame.01')
            .atLocation(token, {cacheLocation: true})
            .size(3, {gridUnits: true})
            .belowTokens()
            .fadeOut(500)
            .zIndex(0);
    /* eslint-enable indent */
}
async function preAnimation(token) {
    const hasAse = animationUtils.aseCheck();
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file(hasAse ? 'animated-spell-effects-cartoon.electricity.09' : 'jb2a.static_electricity.03.blue')
            .atLocation(token)
            .scaleToObject(1.75, {considerTokenScale: true})
            .waitUntilFinished(-200)
        .animation()
            .on(token)
            .opacity(0);
    addCrack(sequence, token);
    sequence
        .effect()
            .file('animated-spell-effects-cartoon.electricity.05')
            .atLocation(token)
            .scaleToObject(1.75, {considerTokenScale: true})
            .playIf(hasAse)
        .effect()
            .file('jb2a.extras.tmfx.outpulse.circle.02.normal')
            .atLocation(token)
            .size(4, {gridUnits: true})
            .opacity(0.5)
            .fadeOut(500)
        .effect()
            .file('jb2a.extras.tmfx.outpulse.circle.02.fast')
            .atLocation(token)
            .size(4, {gridUnits: true})
            .opacity(0.5)
            .fadeOut(500)
            .playIf(isPatreon)
        .canvasPan()
            .shake({duration: 750, strength: 4, rotation: false})
        .wait(750);
    /* eslint-enable indent */
    await sequence.play();
}
async function postAnimation(token) {
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .animation()
            .on(token)
            .opacity(1)
        .canvasPan()
            .shake({duration: 300, strength: 2, rotation: false});
    /* eslint-enable indent */
    addCrack(sequence, token);
    await sequence.play();
}
export const thunderStep = {
    name: 'CHRISPREMADES.Animations.ThunderStep',
    macros: {
        preAnimation,
        postAnimation
    },
    inputs: ['token', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
