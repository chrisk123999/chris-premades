import {animationUtils} from '../../proxy.mjs';
async function pounce(token, positions) {
    positions = positions.map(i => ({x: i.x + token.object.w / 2, y: i.y + token.object.h / 2}));
    let from = token;
    for (let e = 0; e < positions.length; e++) {
        /* eslint-disable indent */
        await new Sequence()
            .animation()
                .on(token)
                .opacity(0)
                .waitUntilFinished(-100)
            .effect()
                .file('animated-spell-effects-cartoon.air.portal')
                .atLocation(from)
                .scaleToObject(1.75)
                .belowTokens()
            .effect()
                .copySprite(token)
                .atLocation(from)   
                .opacity(1)
                .duration(1000)
                .anchor({ x: 0.5, y: 1 })
                .loopProperty('sprite', 'position.y', {values: [50, 0, 50], duration: 500})
                .moveTowards(positions[e], {rotate: false})
                .zIndex(2)
            .effect()
                .copySprite(token)
                .atLocation(from)   
                .opacity(0.5)
                .scale(0.9)
                .belowTokens()
                .duration(1000)
                .anchor({x: 0.5, y: 0.5})
                .filter('ColorMatrix', {brightness: -1})
                .filter('Blur', {blurX: 5, blurY: 10})
                .moveTowards(positions[e], {rotate: false})
                .zIndex(2)
                .waitUntilFinished(-100)
            .animation()
                .on(token)
                .teleportTo(positions[e])
                .snapToGrid()
                .opacity(1)
                .playIf(e === positions.length - 1)
            .effect()
                .file('animated-spell-effects-cartoon.air.portal')
                .atLocation(positions[e])
                .scaleToObject(1.75 * token.width)
                .belowTokens()
            .play();
        /* eslint-enable indent */
        from = positions[e];
    }
}
export const instinctivePounce = {
    name: 'CHRISPREMADES.Animations.Pounce',
    macros: {
        move: pounce
    },
    inputs: ['token', 'positions'],
    requirements: ['animated-spell-effects-cartoon'],
    category: 'classFeature',
    get credits() {
        return [animationUtils.getEskieCredits()];
    }
};
