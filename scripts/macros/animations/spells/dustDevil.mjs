import {animationUtils, summonUtils} from '../../../proxy.mjs';
import {addImpact, addShake, partOption, persistName} from '../generic/spellParts.mjs';
const puff = 'jb2a.smoke.puff.centered.grey';
function summonPrePlace(color) {
    return async (summon, _location, preToken) => {
        const sourceActor = await summon.getSourceActor();
        const file = Sequencer.Database.getEntry('jb2a.whirlwind.' + color, {softFail: true})?.file;
        if (file && preToken.texture.src === sourceActor?.prototypeToken.texture.src) preToken.updateSource({texture: {src: file}});
        preToken.updateSource({alpha: 0});
    };
}
async function postPlace(summon, _location, token) {
    const sound = summon.sounds?.place;
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file(puff)
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .belowTokens()
            .playIf(Sequencer.Database.entryExists(puff))
        .sound()
            .playIf(sound)
            .file(sound)
        .animation()
            .on(token)
            .fadeIn(750)
        .play();
    /* eslint-enable indent */
}
async function preRemove(_summon, token) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(puff)
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .playIf(Sequencer.Database.entryExists(puff))
        .animation()
            .on(token)
            .opacity(0)
            .fadeIn(500)
        .wait(500)
        .play();
    /* eslint-enable indent */
}
function summonAnimation(name, color, requirements) {
    return {
        name,
        macros: {
            prePlace: summonPrePlace(color),
            postPlace,
            preRemove
        },
        inputs: ['summon', 'location', 'token'],
        requirements,
        category: 'spell',
        get credits() { return [animationUtils.getCredits('tyler')]; }
    };
}
async function play(_sourceToken, targetToken, {saved, shake = true} = {}) {
    if (saved === undefined) return;
    const sequence = new Sequence();
    addImpact(sequence, targetToken, 'grey', {scale: saved ? 1 : 1.5});
    addShake(sequence, targetToken, {playIf: shake && !saved});
    await sequence.play();
}
async function create(effect) {
    if (animationUtils.jb2aCheck() !== 'patreon') return;
    const tokens = summonUtils.getSummonsByIdentifier('dustDevil', {actor: effect.parent}).map(summon => summon.token).filter(Boolean);
    const sequence = new Sequence();
    /* eslint-disable indent */
    tokens.forEach(token => sequence
        .effect()
            .name(persistName('dustDevilDebrisCloud', effect))
            .file('jb2a.smoke.ring.01.white')
            .attachTo(token, {bindScale: false})
            .scaleToObject(7)
            .opacity(0.5)
            .tint('#666666')
            .belowTokens()
            .fadeIn(250)
            .fadeOut(250)
            .persist()
            .tieToDocuments(effect));
    /* eslint-enable indent */
    await sequence.play();
}
export const dustDevil = summonAnimation('CHRISPREMADES.Animations.DustDevil', 'blue', ['JB2A_DnD5e']);
export const dustDevilBlueGrey = summonAnimation('CHRISPREMADES.Animations.DustDevilBlueGrey', 'bluegrey', ['jb2a_patreon']);
export const dustDevilBlueWhite = summonAnimation('CHRISPREMADES.Animations.DustDevilBlueWhite', 'bluewhite', ['jb2a_patreon']);
export const dustDevilContact = {
    name: 'CHRISPREMADES.Animations.DustDevilContact',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            shake: partOption('Shake')
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
export const dustDevilDebrisCloud = {
    name: 'CHRISPREMADES.Animations.DustDevilDebrisCloud',
    macros: {
        create
    },
    inputs: ['effect', 'token'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
