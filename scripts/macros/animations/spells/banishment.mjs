import {animationUtils} from '../../../proxy.mjs';
const runeOffsets = [{x: 0.7, y: 0.22}, {x: 0.45, y: -0.61}, {x: -0.45, y: -0.61}, {x: -0.7, y: 0.22}, {x: 0, y: 0.75}];
function addPortal(sequence, targetToken, {delay = 0} = {}) {
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    /* eslint-disable indent */
    sequence
        .effect()
            .file(isPatreon ? 'jb2a.explosion.01.yellow' : 'jb2a.explosion.03.blueyellow')
            .atLocation(targetToken, {offset: {y: -0.75}, gridUnits: true})
            .scaleToObject(1.5)
            .delay(delay)
            .zIndex(1)
        .effect()
            .file('jb2a.portals.vertical.vortex.yellow')
            .atLocation(targetToken, {offset: {y: -0.75}, gridUnits: true})
            .scaleToObject(2)
            .delay(delay)
            .duration(4000)
            .scaleIn({x: 0, y: 0.8}, 500)
            .scaleOut({x: 0, y: 0.4}, 500, {ease: 'easeInBack'})
            .fadeOut(250)
            .belowTokens()
            .zIndex(0.7)
            .playIf(isPatreon);
    /* eslint-enable indent */
}
async function banish(targetToken) {
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.magic_signs.circle.02.conjuration.intro.dark_yellow')
            .atLocation(targetToken)
            .scaleToObject(2)
            .belowTokens()
        .effect()
            .file('jb2a.magic_signs.circle.02.conjuration.loop.dark_yellow')
            .atLocation(targetToken)
            .scaleToObject(2)
            .belowTokens()
            .delay(3000)
            .duration(5000)
            .fadeOut(1000);
    runeOffsets.forEach((offset, index) => {
        sequence
            .effect()
                .file('jb2a.magic_signs.rune.conjuration.complete.yellow')
                .atLocation(targetToken, {offset, gridUnits: true})
                .scaleToObject(0.5)
                .delay(1500 + index * 250)
                .playbackRate(0.65)
                .animateProperty('sprite', 'position.x', {from: 0, to: -offset.x, duration: 500, delay: 2500 - index * 250, ease: 'easeInBack', gridUnits: true})
                .animateProperty('sprite', 'position.y', {from: 0, to: -0.75 - offset.y, duration: 500, delay: 2500 - index * 250, ease: 'easeInBack', gridUnits: true})
                .duration(3000 - index * 250)
                .zIndex(0.9);
    });
    addPortal(sequence, targetToken, {delay: 4000});
    sequence
        .wait(4500)
        .animation()
            .on(targetToken)
            .opacity(0)
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.4, duration: 1500, ease: 'easeInOutBack', gridUnits: true})
            .animateProperty('sprite', 'rotation', {from: 0, to: 16, duration: 500, ease: 'easeOutCubic'})
            .animateProperty('sprite', 'rotation', {from: 0, to: -32, duration: 1000, delay: 500, ease: 'easeInOutCubic'})
            .duration(1500)
            .waitUntilFinished(-100)
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .animateProperty('sprite', 'position.y', {from: -0.4, to: -2, duration: 750, ease: 'easeInOutBack', gridUnits: true})
            .scaleOut(0, 750)
            .duration(400)
            .waitUntilFinished(-150)
        .effect()
            .file('jb2a.fireflies.many.02.yellow')
            .atLocation(targetToken, {offset: {y: -0.75}, gridUnits: true})
            .scaleToObject(0.75)
            .duration(2000)
            .fadeIn(500)
            .fadeOut(750)
            .playIf(animationUtils.jb2aCheck() === 'patreon');
    /* eslint-enable indent */
    await sequence.play();
}
async function banishReturn(targetToken) {
    const sequence = new Sequence();
    addPortal(sequence, targetToken);
    /* eslint-disable indent */
    sequence
        .wait(1000)
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .animateProperty('sprite', 'position.y', {from: -0.75, to: 0, duration: 500, ease: 'easeOutBounce', gridUnits: true})
            .scaleIn(0.25, 500)
            .fadeIn(250)
            .duration(600)
            .waitUntilFinished(-150)
        .animation()
            .on(targetToken)
            .opacity(1);
    /* eslint-enable indent */
    await sequence.play();
}
export const banishment = {
    name: 'CHRISPREMADES.Animations.Banishment',
    macros: {
        banish,
        return: banishReturn
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
