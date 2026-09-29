import {animationUtils} from '../../proxy.mjs';
async function attack(source, targets, {missed} = {}) {
    for (const target of targets) {
        /* eslint-disable indent */
        await new Sequence()
            .effect()
                .copySprite(source)
                .attachTo(source)
                .size(source.width * source.texture.scaleX, {gridUnits: true})
                .fadeOut(150)
                .duration(1800)
                .zIndex(2)
            .effect()
                .delay(150)
                .file('jb2a.flurry_of_blows.no_hit.yellow')
                .atLocation(source)
                .belowTokens(false)
                .stretchTo(target, {randomOffset: 0.2})
                .scale(0.6 * source.width)
                .playbackRate(1)
                .startTime(300)
                .endTime(600)
                .opacity(1)
                .rotate(0)
                .mirrorX(false)
                .repeats(3, 300, 300)
                .randomizeMirrorY()
                .spriteOffset({x: source.width * 0.25}, {gridUnits: true})
                .wait(300)
            .effect()
                .file('jb2a.impact.009.orange')
                .atLocation(target, {randomOffset: 1})
                .missed(missed)
                .size(source.width * 1.25, {gridUnits: true})
                .repeats(20, 50, 50)
                .randomRotation()
            .effect()
                .copySprite(target)
                .atLocation(target)
                .fadeIn(200)
                .fadeOut(200)
                .loopProperty('sprite', 'position.x', {from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .scaleToObject(target.texture.scaleX)
                .duration(1400)
                .opacity(0.25)
            .play();
        /* eslint-enable indent */
    }
}
export const flurryOfBlows = {
    name: 'CHRISPREMADES.Animations.FlurryOfBlows',
    macros: {
        attack
    },
    inputs: ['sourceToken', 'targetTokens', 'options'],
    requirements: ['jb2a_patreon'],
    category: 'weaponAttacks',
    get credits() { return [animationUtils.getEskieCredits()]; }
};
