import {animationUtils} from '../../../proxy.mjs';
import {addCast, colorOption, getPalette, makePreset, partOption} from './spellParts.mjs';
const colorMap = {
    yellow: 'Yellow',
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    red: 'Red'
};
const palettes = {
    patreon: {
        yellow: {cast: 'jb2a.cast_generic.01.yellow.0', buff: 'jb2a.on_token_buff.001.001.orangeyellow', impact: 'jb2a.impact.002.yellow', aura: 'jb2a.markers.light.loop.yellow'},
        blue: {cast: 'jb2a.cast_generic.01.blue.0', buff: 'jb2a.on_token_buff.001.001.blue', impact: 'jb2a.impact.002.blue', aura: 'jb2a.markers.light.loop.blue'},
        green: {cast: 'jb2a.cast_generic.02.green.0', buff: 'jb2a.on_token_buff.001.001.greenyellow', impact: 'jb2a.impact.002.green', aura: 'jb2a.markers.light.loop.green'},
        purple: {cast: 'jb2a.cast_generic.01.dark_purple.0', buff: 'jb2a.on_token_buff.001.001.bluepurple', impact: 'jb2a.impact.002.dark_purple', aura: 'jb2a.markers.light.loop.purple'},
        red: {cast: 'jb2a.cast_generic.01.dark_red.0', buff: 'jb2a.on_token_buff.001.001.purplered', impact: 'jb2a.impact.002.dark_red', aura: 'jb2a.markers.light.loop.red'}
    },
    free: {
        yellow: {cast: 'jb2a.cast_generic.01.yellow.0', buff: 'jb2a.on_token_buff.001.001.orangeyellow', impact: 'jb2a.impact.yellow.0'},
        blue: {cast: 'jb2a.cast_generic.02.blue.0', buff: 'jb2a.on_token_buff.001.001.blue', impact: 'jb2a.impact.002.blue', aura: 'jb2a.markers.light.loop.blue'}
    }
};
const shields = {
    patreon: Object.fromEntries(['blue', 'green', 'purple', 'red', 'yellow'].map(color => [color, 'jb2a.shield.01.{part}.' + color])),
    free: {
        blue: 'jb2a.shield.01.{part}.blue'
    }
};
function getName(effect) {
    return 'castBuff ' + effect.uuid;
}
function addShield(sequence, effect, targetToken, file) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file(file.replace('{part}', 'intro'))
            .attachTo(targetToken)
            .scaleToObject(1.6)
            .zIndex(1)
            .waitUntilFinished(-250)
        .effect()
            .name(getName(effect))
            .file(file.replace('{part}', 'loop'))
            .attachTo(targetToken)
            .scaleToObject(1.6)
            .zIndex(1)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect);
    /* eslint-enable indent */
}
function buildBuff(sourceToken, targetToken, files, cast) {
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.buff)
            .attachTo(targetToken, {bindRotation: false})
            .scaleToObject(1)
            .playbackRate(1.5)
        .effect()
            .file(files.impact)
            .attachTo(targetToken)
            .scaleToObject(0.8)
            .zIndex(2);
    /* eslint-enable indent */
    return sequence;
}
async function play(sourceToken, targetToken, {color = 'yellow', cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (files) await buildBuff(sourceToken, targetToken, files, cast).play();
}
async function create(effect, targetToken, {color = 'yellow', cast = true, aura = false, shield = false} = {}, {sourceToken} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    const sequence = buildBuff(sourceToken, targetToken, files, cast);
    /* eslint-disable indent */
    if (aura && files.aura) {
        sequence
            .effect()
                .name(getName(effect))
                .file(files.aura)
                .attachTo(targetToken)
                .scaleToObject(1.8)
                .fadeIn(1000)
                .fadeOut(500)
                .persist()
                .tieToDocuments(effect);
    }
    /* eslint-enable indent */
    if (shield) addShield(sequence, effect, targetToken, getPalette(shields, color));
    await sequence.play();
}
async function remove(effect, targetToken, {color = 'yellow', shield = false} = {}) {
    await Sequencer.EffectManager.endEffects({name: getName(effect), object: targetToken});
    if (!shield) return;
    const file = getPalette(shields, color);
    if (file) await new Sequence().effect().file(file.replace('{part}', 'outro_fade')).atLocation(targetToken).scaleToObject(1.6).play();
}
export const castBuff = {
    name: 'CHRISPREMADES.Animations.CastBuff',
    macros: {
        play,
        create,
        delete: remove
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'generic',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.SpellParts.BuffColorHint'}),
            cast: partOption('Cast'),
            aura: partOption('Aura', {defaultValue: false, hint: 'CHRISPREMADES.Animations.SpellParts.PersistentHint'}),
            shield: partOption('Shield', {defaultValue: false, hint: 'CHRISPREMADES.Animations.SpellParts.PersistentHint'})
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
export const guidance = makePreset(castBuff, 'CHRISPREMADES.Animations.Guidance', {color: 'yellow', aura: true});
