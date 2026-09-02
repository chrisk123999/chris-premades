import {animationUtils} from '../../proxy.mjs';
async function create(effect, token, config) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.smoke.puff.centered.dark_black')
            .atLocation(token)
            .scaleToObject(2.1 * token.texture.scaleX)
            .belowTokens()
            .opacity(0.5)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .randomRotation()
        .animation()
            .on(token)
            .delay(1000)
            .opacity(0)
        .effect()
            .copySprite(token)
            .atLocation(token)
            .scale(token.texture.scaleX)
            .tint('#6b6b6b')
            .fadeIn(1000)
            .duration(3000)
            .animateProperty('alphaFilter', 'alpha', {from: 0, to: -0.2, duration: 1000, delay: 1000})
        .animation()
            .on(token)
            .delay(3000)
            .opacity(0.8)
            .tint('#6b6b6b')
        .play();
    /* eslint-enable indent */
}
async function remove(effect, token, config) {
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file('jb2a.smoke.puff.centered.dark_black')
            .atLocation(token)
            .scaleToObject(2.1 * token.texture.scaleX)
            .belowTokens()
            .opacity(0.5)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .randomRotation()
        .animation()
            .on(token)
            .fadeIn(500)
            .opacity(1)
            .tint('')
        .play();
    /* eslint-enable indent */
}
export const hide = {
    name: 'CHRISPREMADES.Animations.Hide',
    macros: {
        create,
        delete: remove
    },
    inputs: ['effect', 'token', 'config'],
    requirements: ['jb2a_patreon'],
    category: 'feature',
    get credits() {
        return [animationUtils.getEskieCredits()];
    }
};