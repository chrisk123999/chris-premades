import {animationUtils} from '../../../proxy.mjs';
import {getConfig, getRemaining} from '../../all/spells/mirrorImage.mjs';
import {addCast, casts, getPalette, impacts, persistName} from '../generic/spellParts.mjs';
function getName(effect, index) {
    return persistName('mirrorImage', effect) + ' ' + index;
}
function getOffset(effect, index) {
    const angle = Math.PI / 2 + (2 * Math.PI * index) / Math.max(1, Number(getConfig(effect, 'duplicates')));
    return {x: Math.cos(angle) * 0.35, y: Math.sin(angle) * 0.35};
}
async function create(effect, targetToken, _config, {sourceToken} = {}) {
    const castFile = getPalette(casts, 'dark_purple');
    if (!castFile) return;
    const sequence = new Sequence();
    addCast(sequence, sourceToken ?? targetToken, targetToken, {file: castFile, wait: -750});
    for (let index = 0; index < getRemaining(effect); index++) {
        const offset = getOffset(effect, index);
        /* eslint-disable indent */
        sequence
            .effect()
                .name(getName(effect, index))
                .copySprite(targetToken)
                .attachTo(targetToken, {bindRotation: false})
                .scaleToObject(1, {considerTokenScale: true})
                .spriteOffset(offset, {gridUnits: true})
                .loopProperty('sprite', 'position.x', {from: -0.06, to: 0.06, duration: 1200 + index * 300, pingPong: true, gridUnits: true})
                .loopProperty('alphaFilter', 'alpha', {from: 0.35, to: 0.6, duration: 900 + index * 200, pingPong: true})
                .belowTokens()
                .fadeIn(750)
                .fadeOut(500)
                .persist()
                .tieToDocuments(effect);
        /* eslint-enable indent */
    }
    await sequence.play();
}
async function play(_sourceToken, targetToken, {effect, index = 0, missed = false} = {}) {
    if (!effect) return;
    const impactFile = getPalette(impacts, 'purple');
    if (!missed) await Sequencer.EffectManager.endEffects({name: getName(effect, index), object: targetToken});
    if (!impactFile) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(impactFile)
            .atLocation(targetToken, {offset: getOffset(effect, index), gridUnits: true})
            .scaleToObject(missed ? 0.5 : 0.9)
            .randomRotation()
            .zIndex(1)
        .play();
    /* eslint-enable indent */
}
export const mirrorImage = {
    name: 'CHRISPREMADES.Animations.MirrorImage',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
