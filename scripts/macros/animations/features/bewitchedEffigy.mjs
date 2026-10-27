import {getPalette} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        green: {
            sign: 'jb2a.magic_signs.circle.02.conjuration.complete.dark_green',
            burst: 'jb2a.swirling_leaves.outburst.01.greenorange',
            ring: 'jb2a.plant_growth.04.ring.4x4.complete.greenwhite',
            leaves: 'jb2a.swirling_leaves.loop.01.greenorange',
            outflow: 'jb2a.extras.tmfx.outflow.circle.01'
        }
    },
    free: {
        green: {
            sign: 'jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow',
            burst: 'jb2a.swirling_leaves.complete.01.green',
            ring: 'jb2a.plant_growth.03.ring.4x4.complete.greenyellow',
            leaves: 'jb2a.swirling_leaves.loop.01.green',
            outflow: 'jb2a.extras.tmfx.outflow.circle.01'
        }
    }
};
async function prePlace(_summon, _location, preToken) {
    if (!getPalette(palettes, 'green')) return;
    preToken.updateSource({alpha: 0});
}
async function postPlace(summon, _location, token) {
    const files = getPalette(palettes, 'green');
    if (!files) return;
    const sound = summon.sounds?.place;
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file(files.sign)
            .atLocation(token)
            .belowTokens()
            .scaleToObject(2)
            .fadeIn(300)
            .fadeOut(600)
        .effect()
            .file(files.ring)
            .atLocation(token)
            .belowTokens()
            .randomRotation()
            .scaleToObject(2.5)
            .fadeOut(800)
            .wait(600)
        .effect()
            .file(files.burst)
            .atLocation(token)
            .scaleToObject(2.5)
            .zIndex(2)
        .sound()
            .playIf(sound)
            .file(sound)
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
        .effect()
            .name('BewitchedEffigy.' + token.id)
            .file(files.outflow)
            .attachTo(token, {bindVisibility: false, bindAlpha: false})
            .scaleToObject(1.4, {considerTokenScale: true})
            .belowTokens()
            .opacity(0.35)
            .tint('#7a9b3c')
            .fadeIn(1000)
            .persist()
        .effect()
            .name('BewitchedEffigy.' + token.id)
            .file(files.leaves)
            .attachTo(token, {bindVisibility: false, bindAlpha: false})
            .scaleToObject(1.6, {considerTokenScale: true})
            .opacity(0.6)
            .fadeIn(1000)
            .persist()
        .play();
    /* eslint-enable indent */
}
async function preRemove(_summon, token) {
    Sequencer.EffectManager.endEffects({name: 'BewitchedEffigy.' + token.id});
    /* eslint-disable indent */
    await new Sequence()
        .animation()
            .on(token)
            .opacity(0)
            .fadeIn(500)
        .wait(500)
        .play();
    /* eslint-enable indent */
}
export const bewitchedEffigySummon = {
    name: 'CHRISPREMADES.Animations.BewitchedEffigySummon',
    macros: {
        prePlace,
        postPlace,
        preRemove
    },
    inputs: ['summon', 'location', 'token'],
    requirements: ['JB2A_DnD5e'],
    category: 'classFeature'
};
