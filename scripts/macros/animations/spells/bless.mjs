import {animationUtils} from '../../../proxy.mjs';
import {colorOption, endPersist, getPalette, makePreset, partOption, persistName} from '../generic/spellParts.mjs';
const colorMap = {
    yellow: 'Yellow',
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple'
};
const palettes = {
    patreon: {
        yellow: {intro: 'jb2a.bless.200px.intro.yellow', loop: 'jb2a.bless.200px.loop.yellow', inflow: 'jb2a.extras.tmfx.inflow.circle.03', particles: 'jb2a.particles.inward.orange.01.03', light: 'jb2a.markers.light.complete.yellow', flash: 5, ring: '#FFFFFF'},
        blue: {intro: 'jb2a.bless.200px.intro.blue', loop: 'jb2a.bless.200px.loop.blue', inflow: 'jb2a.extras.tmfx.inflow.circle.03', particles: 'jb2a.particles.inward.blue.01.03', light: 'jb2a.markers.light.complete.blue', flash: 5, ring: '#FFFFFF'},
        green: {intro: 'jb2a.bless.200px.intro.green', loop: 'jb2a.bless.200px.loop.green', inflow: 'jb2a.extras.tmfx.inflow.circle.03', particles: 'jb2a.particles.inward.greenyellow.01.03', light: 'jb2a.markers.light.complete.green', flash: 5, ring: '#FFFFFF'},
        purple: {intro: 'jb2a.bless.200px.intro.purple', loop: 'jb2a.bless.200px.loop.purple', inflow: 'jb2a.extras.tmfx.inflow.circle.03', particles: 'jb2a.particles.inward.purple.01.03', light: 'jb2a.markers.light.complete.purple', flash: 0, ring: '#2E0854'}
    },
    free: {
        yellow: {intro: 'jb2a.bless.200px.intro.yellow', loop: 'jb2a.bless.200px.loop.yellow', inflow: 'jb2a.extras.tmfx.inflow.circle.01', particles: 'jb2a.particles.inward.greenyellow.01.03', flash: 5, ring: '#FFFFFF'},
        purple: {loop: 'jb2a.condition.curse.01.001.red', inflow: 'jb2a.extras.tmfx.inflow.circle.01', flash: 0, ring: '#2E0854'}
    }
};
function addTarget(sequence, targetToken, files) {
    /* eslint-disable indent */
    sequence
        .effect()
            .copySprite(targetToken)
            .atLocation(targetToken)
            .filter('ColorMatrix', {brightness: files.flash, saturate: -1})
            .filter('Blur', {blurX: 10, blurY: 10})
            .fadeIn(250)
            .fadeOut(500)
            .duration(1000)
            .delay(1150)
        .effect()
            .file(files.loop)
            .atLocation(targetToken)
            .fadeIn(500, {delay: 250})
            .fadeOut(500)
            .delay(900)
            .zIndex(1);
    /* eslint-enable indent */
}
function addArea(sequence, sourceToken, files) {
    const gridSize = sourceToken.parent.grid.size;
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.inflow)
            .atLocation(sourceToken)
            .size(12.65, {gridUnits: true})
            .belowTokens()
            .opacity(0.15)
            .duration(1800)
            .fadeIn(250)
            .fadeOut(500)
            .delay(1200)
            .zIndex(1);
    if (files.particles) {
        sequence
            .effect()
                .file(files.particles)
                .atLocation(sourceToken)
                .size(12.65, {gridUnits: true})
                .belowTokens()
                .opacity(0.05)
                .duration(1800)
                .fadeIn(250)
                .fadeOut(500)
                .delay(1200)
                .zIndex(1);
    }
    if (files.light) {
        sequence
            .effect()
                .file(files.light)
                .atLocation(sourceToken)
                .size(20, {gridUnits: true})
                .spriteScale({x: 0.5, y: 1.25})
                .belowTokens()
                .opacity(0.5)
                .duration(2800)
                .randomRotation()
                .fadeIn(500)
                .fadeOut(500)
                .shape('circle', {lineSize: gridSize * 5.2, lineColor: '#FF0000', radius: 8.85, gridUnits: true, isMask: true})
                .zIndex(2)
                .repeats(3, 150, 150);
    }
    sequence
        .effect()
            .atLocation(sourceToken)
            .size(18, {gridUnits: true})
            .belowTokens()
            .opacity(0.1)
            .duration(1500)
            .fadeIn(250)
            .fadeOut(500)
            .delay(1200)
            .shape('circle', {lineSize: gridSize * 0.24, lineColor: files.ring, radius: 6.175, gridUnits: true, isMask: false})
            .filter('Blur', {blurX: 10, blurY: 10});
    /* eslint-enable indent */
}
async function play(sourceToken, region, {color = 'yellow', cast = true, targets = []} = {}) {
    const files = getPalette(palettes, color);
    if (!files || !sourceToken) return;
    const sequence = new Sequence();
    if (cast && files.intro) sequence.effect().file(files.intro).atLocation(sourceToken);
    targets.filter(target => target.saved !== true).forEach(target => addTarget(sequence, target.token, files));
    addArea(sequence, sourceToken, files);
    await sequence.play();
}
async function create(effect, targetToken, {color = 'yellow', aura = true} = {}) {
    const files = getPalette(palettes, color);
    if (!files || !aura) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name(persistName('bless', effect))
            .file(files.loop)
            .attachTo(targetToken)
            .scaleToObject(1.5)
            .belowTokens()
            .opacity(0.6)
            .delay(1500)
            .fadeIn(1000)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const bless = {
    name: 'CHRISPREMADES.Animations.Bless',
    macros: {
        play,
        create,
        delete: endPersist('bless')
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, Object.keys(palettes.free), {auto: false, hint: 'CHRISPREMADES.Animations.BlessColorHint'}),
            cast: partOption('Cast'),
            aura: partOption('Aura', {hint: 'CHRISPREMADES.Animations.SpellParts.PersistentHint'})
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
export const bane = makePreset(bless, 'CHRISPREMADES.Animations.Bane', {color: 'purple'});
