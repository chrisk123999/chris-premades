import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
function getPullPoint(sourceToken, targetToken) {
    const origin = targetToken.getCenterPoint();
    const destination = sourceToken.getCenterPoint();
    const distance = Math.hypot(destination.x - origin.x, destination.y - origin.y);
    if (!distance) return origin;
    const offset = targetToken.parent.grid.size / 2.5;
    return {x: origin.x + ((destination.x - origin.x) / distance * offset), y: origin.y + ((destination.y - origin.y) / distance * offset)};
}
async function pull(sourceToken, targetToken) {
    const pullPoint = getPullPoint(sourceToken, targetToken);
    const alpha = targetToken.alpha;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('animated-spell-effects-cartoon.energy.tentacles')
            .atLocation(targetToken)
            .moveTowards(pullPoint, {rotate: true, ease: 'easeOutBack'})
            .scaleToObject(1)
            .opacity(0.75)
            .playIf(!!animationUtils.aseCheck())
        .animation()
            .on(targetToken)
            .opacity(0)
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .moveTowards(pullPoint, {rotate: false, ease: 'easeOutBack'})
            .scaleToObject(1, {considerTokenScale: true})
            .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true})
            .duration(750)
            .opacity(0.15)
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .moveTowards(pullPoint, {rotate: false, ease: 'easeOutBack'})
            .scaleToObject(1, {considerTokenScale: true})
            .duration(750)
            .waitUntilFinished(-50)
        .effect()
            .copySprite(targetToken)
            .atLocation(pullPoint)
            .moveTowards(targetToken, {rotate: false})
            .scaleToObject(1, {considerTokenScale: true})
            .duration(1500)
            .waitUntilFinished(-50)
        .animation()
            .on(targetToken)
            .opacity(alpha)
        .play();
    /* eslint-enable indent */
}
async function play(sourceToken, region, {pull: pullTargets = true, targets = [], radius} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.ward.rune.dark_purple.01')
            .atLocation(sourceToken)
            .scaleToObject(1.85)
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .belowTokens()
            .fadeOut(2000)
            .zIndex(0)
            .playIf(isPatreon)
        .effect()
            .file('jb2a.arms_of_hadar.dark_purple')
            .atLocation(sourceToken)
            .randomRotation()
            .scaleIn(0, 1500, {ease: 'easeOutCirc'})
            .fadeOut(500)
            .belowTokens()
            .scaleToObject(1.75)
            .zIndex(1)
        .effect()
            .file('jb2a.extras.tmfx.outflow.circle.01')
            .atLocation(sourceToken)
            .randomRotation()
            .size(1.5, {gridUnits: true})
            .rotateIn(180, 600, {ease: 'easeOutCubic'})
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .belowTokens()
            .zIndex(0.1)
        .effect()
            .file('jb2a.particles.outward.purple.01.02')
            .atLocation(sourceToken)
            .scaleIn(0, 1000, {ease: 'easeOutQuint'})
            .delay(500)
            .fadeOut(1000)
            .duration(1000)
            .size(1.75, {gridUnits: true})
            .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.5, gridUnits: true, duration: 1000})
            .zIndex(1)
            .playIf(isPatreon)
        .wait(1000)
        .effect()
            .file(isPatreon ? 'jb2a.extras.tmfx.border.circle.inpulse.01.fast' : 'jb2a.extras.tmfx.border.circle.inpulse.01.normal')
            .atLocation(sourceToken)
            .scaleToObject(1.5)
            .waitUntilFinished()
        .effect()
            .file('jb2a.impact.ground_crack.dark_red.02')
            .atLocation(geometry.center)
            .size(geometry.size * 0.7)
            .delay(150)
            .belowTokens()
            .playIf(isPatreon)
        .effect()
            .file('jb2a.impact.004.dark_purple')
            .atLocation(geometry.center)
            .scaleToObject(4)
            .scaleIn(0, 500, {ease: 'easeOutCirc'})
            .delay(150)
            .playIf(isPatreon)
        .effect()
            .file('jb2a.arms_of_hadar.dark_purple')
            .atLocation(geometry.center)
            .randomRotation()
            .size(geometry.size * 1.2)
            .scaleIn(0, 750, {ease: 'easeOutCirc'})
            .animateProperty('sprite', 'width', {from: geometry.size * 1.1, to: 0, duration: 1500, delay: 1000, ease: 'easeOutCirc'})
            .animateProperty('sprite', 'height', {from: geometry.size * 1.1, to: 0, duration: 1500, delay: 1000, ease: 'easeOutCirc'})
            .fadeOut(500)
            .duration(2000)
            .delay(150)
            .belowTokens()
            .zIndex(1)
        .play();
    /* eslint-enable indent */
    if (!pullTargets) return;
    await Promise.all(targets.filter(target => target.saved === false && target.token !== sourceToken).map(target => pull(sourceToken, target.token)));
}
export const armsOfHadar = {
    name: 'CHRISPREMADES.Animations.ArmsOfHadar.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        pull: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Animations.ArmsOfHadar.Pull',
            hint: 'CHRISPREMADES.Animations.ArmsOfHadar.PullHint'
        }
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
