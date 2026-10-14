import {animationUtils} from '../../../proxy.mjs';
import {addShake, partOption} from '../generic/spellParts.mjs';
async function prePlace(summon, location, preToken) {
    const sourceActor = await summon.getSourceActor();
    const file = Sequencer.Database.getEntry('jb2a.flaming_sphere.400px.orange.02', {softFail: true})?.file;
    if (file && preToken.texture.src === sourceActor?.prototypeToken.texture.src) preToken.updateSource({texture: {src: file, scaleX: 2, scaleY: 2}});
    preToken.updateSource({alpha: 0});
}
async function postPlace(summon, location, token) {
    const sound = summon.sounds?.place;
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file('jb2a.impact.fire.01.orange')
            .atLocation(token)
            .scaleToObject(2)
            .randomRotation()
            .zIndex(5)
        .effect()
            .file('jb2a.explosion.01.orange')
            .atLocation(token)
            .scaleToObject(1.5)
            .belowTokens()
            .fadeOut(500)
        .sound()
            .playIf(sound)
            .file(sound)
        .animation()
            .on(token)
            .fadeIn(500)
        .play();
    /* eslint-enable indent */
}
async function preRemove(summon, token) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.smoke.puff.centered.grey')
            .atLocation(token)
            .scaleToObject(1.5)
            .randomRotation()
        .animation()
            .on(token)
            .opacity(0)
            .fadeIn(500)
        .wait(500)
        .play();
    /* eslint-enable indent */
}
async function play(sourceToken, targetToken, {saved, shake = true} = {}) {
    if (saved === undefined) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.fire.01.orange')
            .atLocation(targetToken)
            .scaleToObject(saved ? 1.25 : 2)
            .randomRotation()
            .zIndex(2);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {playIf: shake && !saved});
    await sequence.play();
}
export const flamingSphere = {
    name: 'CHRISPREMADES.Animations.FlamingSphere',
    macros: {
        prePlace,
        postPlace,
        preRemove
    },
    inputs: ['summon', 'location', 'token'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
export const flamingSphereBurn = {
    name: 'CHRISPREMADES.Animations.FlamingSphereBurn',
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
