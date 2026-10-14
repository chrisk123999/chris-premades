import {animationUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, persistName} from '../generic/spellParts.mjs';
async function create(effect, targetToken, _config, {sourceToken} = {}) {
    const castFile = getPalette(casts, 'dark_purple');
    if (!castFile) return;
    const sequence = new Sequence();
    addCast(sequence, sourceToken ?? targetToken, targetToken, {file: castFile, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .name(persistName('blur', effect))
            .copySprite(targetToken)
            .attachTo(targetToken, {bindRotation: false})
            .scaleToObject(1, {considerTokenScale: true})
            .filter('Blur', {strength: 2, blur: 4})
            .loopProperty('sprite', 'position.x', {from: -0.08, to: 0.08, duration: 160, pingPong: true, gridUnits: true})
            .loopProperty('sprite', 'position.y', {from: -0.04, to: 0.04, duration: 230, pingPong: true, gridUnits: true})
            .loopProperty('alphaFilter', 'alpha', {from: 0.45, to: 0.7, duration: 700, pingPong: true})
            .fadeIn(750)
            .fadeOut(500)
            .zIndex(1)
            .persist()
            .tieToDocuments(effect);
    /* eslint-enable indent */
    await sequence.play();
}
async function remove(effect, targetToken) {
    await Sequencer.EffectManager.endEffects({name: persistName('blur', effect), object: targetToken});
}
export const blur = {
    name: 'CHRISPREMADES.Animations.Blur',
    macros: {
        create,
        delete: remove
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
