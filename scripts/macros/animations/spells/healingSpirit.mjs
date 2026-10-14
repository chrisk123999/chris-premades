import {animationUtils} from '../../../proxy.mjs';
import {getPalette} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        yellow: {
            strands: 'jb2a.energy_strands.in.green.01',
            marker: 'jb2a.markers.02.yellow',
            butterfly: 'jb2a.butterflies.single.yellow',
            butterfliesMany: 'jb2a.butterflies.many.yellow',
            butterfliesFew: 'jb2a.butterflies.few.yellow',
            field: 'jb2a.energy_field.02.above.green',
            mist: 'jb2a.misty_step.02.yellow',
            outflow: 'jb2a.extras.tmfx.outflow.circle.01'
        }
    },
    free: {
        yellow: {
            strands: 'jb2a.energy_strands.in.green.01',
            marker: 'jb2a.markers.light.complete.blue',
            butterfly: 'jb2a.butterflies.single.orange',
            butterfliesMany: 'jb2a.butterflies.many.orange',
            butterfliesFew: 'jb2a.butterflies.few.orange',
            field: 'jb2a.energy_field.02.above.blue',
            mist: 'jb2a.misty_step.02.blue',
            outflow: 'jb2a.extras.tmfx.outflow.circle.01'
        }
    }
};
async function prePlace(_summon, _location, preToken) {
    if (!getPalette(palettes, 'yellow')) return;
    preToken.updateSource({alpha: 0, texture: {tint: '#beff5c'}});
}
async function postPlace(summon, _location, token) {
    const files = getPalette(palettes, 'yellow');
    if (!files) return;
    const sound = summon.sounds?.place;
    /* eslint-disable indent */
    new Sequence()
        .wait(500)
        .effect()
            .file(files.strands)
            .atLocation(token)
            .scaleToObject(1)
            .fadeIn(500)
            .fadeOut(500)
            .opacity(0.8)
            .filter('ColorMatrix', {hue: -15})
            .loopProperty('sprite', 'width', {from: 0, to: -0.05, duration: 50, pingPong: true, gridUnits: true, ease: 'easeInCubic'})
            .loopProperty('sprite', 'height', {from: 0, to: -0.05, duration: 100, pingPong: true, gridUnits: true, ease: 'easeInQuint'})
        .effect()
            .file(files.marker)
            .atLocation(token)
            .scaleToObject(1)
            .fadeIn(1000)
            .fadeOut(500)
            .scaleIn(0, 2500, {ease: 'easeOutCubic'})
            .filter('ColorMatrix', {hue: 15, saturate: 1})
            .loopProperty('sprite', 'width', {from: 0, to: -0.05, duration: 50, pingPong: true, gridUnits: true, ease: 'easeInCubic'})
            .loopProperty('sprite', 'height', {from: 0, to: -0.05, duration: 100, pingPong: true, gridUnits: true, ease: 'easeInQuint'})
            .zIndex(0)
        .effect()
            .file(files.butterfly)
            .atLocation(token)
            .scaleToObject(1.1, {considerTokenScale: true})
            .fadeIn(500)
            .zIndex(1)
        .effect()
            .file(files.field)
            .attachTo(token, {bindVisibility: false, bindAlpha: false, bindRotation: true})
            .scaleToObject(1.2, {considerTokenScale: true})
            .fadeOut(500)
            .mask(token)
            .opacity(1)
            .duration(2000)
            .startTime(3000)
        .effect()
            .file(files.mist)
            .atLocation(token)
            .scaleToObject(1.5)
            .startTime(1500)
            .filter('ColorMatrix', {hue: 15})
        .sound()
            .playIf(sound)
            .file(sound)
        .animation()
            .on(token)
            .fadeIn(1500)
            .opacity(0.4)
        .effect()
            .name('HealingSpirit.' + token.id)
            .file(files.butterfliesMany)
            .attachTo(token, {bindVisibility: false, bindAlpha: false, bindRotation: true})
            .scaleToObject(0.9, {considerTokenScale: true})
            .fadeIn(500)
            .persist()
            .belowTokens()
            .zIndex(1)
        .effect()
            .name('HealingSpirit.' + token.id)
            .file(files.butterfliesFew)
            .attachTo(token, {bindVisibility: false, bindAlpha: false, bindRotation: true})
            .scaleToObject(0.9, {considerTokenScale: true})
            .fadeIn(500)
            .persist()
            .zIndex(1)
        .effect()
            .name('HealingSpirit.' + token.id)
            .file(files.outflow)
            .attachTo(token, {bindVisibility: false, bindAlpha: false, bindRotation: true})
            .scaleToObject(1.15, {considerTokenScale: true})
            .persist()
            .opacity(0.2)
            .belowTokens()
            .tint('#a5fe39')
        .effect()
            .name('HealingSpirit.' + token.id)
            .file(files.field)
            .attachTo(token, {bindVisibility: false, bindAlpha: false, bindRotation: true})
            .scaleToObject(1.2, {considerTokenScale: true})
            .fadeIn(500)
            .mask(token)
            .opacity(1)
            .persist()
        .effect()
            .name('HealingSpirit.' + token.id)
            .file(token.texture.src)
            .attachTo(token, {bindVisibility: false, bindAlpha: false, bindRotation: true})
            .scaleToObject(1, {considerTokenScale: true})
            .fadeIn(500)
            .persist()
            .filter('Glow', {color: 0xa5fe39, knockout: true, distance: 2.5, innerStrength: 0})
            .loopProperty('alphaFilter', 'alpha', {from: 0.1, to: 0.8, duration: 1250, pingPong: true})
        .play();
    /* eslint-enable indent */
}
async function preRemove(_summon, token) {
    Sequencer.EffectManager.endEffects({name: 'HealingSpirit.' + token.id});
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
export const healingSpiritSummon = {
    name: 'CHRISPREMADES.Animations.HealingSpiritSummon',
    macros: {
        prePlace,
        postPlace,
        preRemove
    },
    inputs: ['summon', 'location', 'token'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
