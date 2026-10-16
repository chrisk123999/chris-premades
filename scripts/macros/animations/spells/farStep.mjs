import {animationUtils} from '../../../proxy.mjs';
import {endPersist, persistName} from '../generic/spellParts.mjs';
async function flash(token, visible) {
    /* eslint-disable indent */
    const sequence = new Sequence()
        .effect()
            .file(animationUtils.jb2aCheck() === 'patreon' ? 'jb2a.explosion.07.bluewhite' : 'jb2a.explosion.02.blue')
            .atLocation(token, {cacheLocation: false})
            .scaleToObject(1.5)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .fadeOut(1000)
        .animation()
            .delay(300)
            .on(token)
            .opacity(visible ? 1 : 0);
    /* eslint-enable indent */
    if (!visible) sequence.waitUntilFinished();
    await sequence.play();
}
async function create(effect, targetToken) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name(persistName('farStep', effect))
            .file('jb2a.token_border.circle.spinning.blue.001')
            .attachTo(targetToken, {bindAlpha: false})
            .scaleToObject(2)
            .scaleIn(0, 1000, {ease: 'easeOutElastic'})
            .scaleOut(0, 500, {ease: 'easeOutElastic'})
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const farStep = {
    name: 'CHRISPREMADES.Animations.FarStep',
    macros: {
        preAnimation: token => flash(token, false),
        postAnimation: token => flash(token, true)
    },
    inputs: ['token', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
export const farStepBorder = {
    name: 'CHRISPREMADES.Animations.FarStepBorder',
    macros: {
        create,
        delete: endPersist('farStep')
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
