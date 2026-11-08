import {animationUtils, tokenUtils} from '../../../proxy.mjs';
import {castTouch} from '../generic/castTouch.mjs';
const files = [
    'animated-spell-effects-cartoon.mix.electric ball.01',
    'animated-spell-effects-cartoon.air.portal',
    'jb2a.particles.outward.blue.01.03',
    'jb2a.impact.002.pinkpurple',
    'jb2a.impact.009.purple',
    'animated-spell-effects-cartoon.magic.mind sliver',
    'animated-spell-effects-cartoon.air.puff.01',
    'animated-spell-effects-cartoon.electricity.blast.03'
];
const glow = {color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1};
const afterimageName = token => 'steelWindStrike-' + token.id;
function addVanishSprite(sequence, token, sprite) {
    const effect = sequence.effect();
    if (sprite) effect.copySprite(token);
    else effect.file('jb2a.particles.outward.blue.01.03');
    return effect
        .atLocation(token)
        .scaleToObject(1.1)
        .filter('ColorMatrix', {saturate: -1, brightness: 10})
        .filter('Blur', {blurX: 5, blurY: 10})
        .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2})
        .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.75, duration: 300, ease: 'easeOutCubic', gridUnits: true})
        .animateProperty('sprite', 'width', {from: 1, to: sprite ? 0.025 : 0.5, duration: sprite ? 300 : 100, ease: 'easeOutCubic', gridUnits: true})
        .animateProperty('sprite', 'height', {from: 1, to: 1.5, duration: 300, ease: 'easeOutCubic', gridUnits: true})
        .fadeOut(200)
        .duration(400)
        .attachTo(token, {bindAlpha: false});
}
function addTargetBlur(sequence, target) {
    return sequence
        .effect()
        .copySprite(target)
        .atLocation(target)
        .animateProperty('sprite', 'position.y', {from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false})
        .animateProperty('sprite', 'position.y', {from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90})
        .extraEndDuration(30)
        .filter('Blur', {blurX: 0, blurY: 5})
        .opacity(0.35);
}
function shakeTarget(target, chance = 1) {
    const sequence = new Sequence();
    addTargetBlur(sequence, target);
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.009.purple')
            .atLocation(target, {randomOffset: 1, gridUnits: true})
            .randomRotation()
            .scaleToObject(1)
            .filter('ColorMatrix', {saturate: -0.4})
            .playIf(Math.random() < chance)
            .zIndex(0)
        .play();
    /* eslint-enable indent */
}
function knockDown(target) {
    const sequence = new Sequence();
    addTargetBlur(sequence, target);
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.009.purple')
            .atLocation(target, {gridUnits: true})
            .randomRotation()
            .scaleToObject(2)
            .filter('ColorMatrix', {saturate: -0.4})
            .zIndex(0)
            .delay(700)
            .waitUntilFinished(-500)
        .animation()
            .on(target)
            .opacity(0)
        .effect()
            .copySprite(target)
            .scaleToObject(1)
            .atLocation(target, {local: true})
            .filter('ColorMatrix', {brightness: -1})
            .filter('Blur', {blurX: 5, blurY: 10})
            .animateProperty('sprite', 'scale.x', {from: 1, to: 0.9, duration: 500, ease: 'easeOutCubic'})
            .animateProperty('sprite', 'scale.y', {from: 1, to: 0.9, duration: 500, ease: 'easeOutCubic'})
            .animateProperty('sprite', 'scale.x', {from: 1, to: 1.1, duration: 250, delay: 500, ease: 'easeOutCubic'})
            .animateProperty('sprite', 'scale.y', {from: 1, to: 1.1, duration: 250, delay: 500, ease: 'easeOutCubic'})
            .opacity(0.5)
            .belowTokens()
        .effect()
            .copySprite(target)
            .atLocation(target, {local: true})
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 500, gridUnits: true, ease: 'easeOutCubic'})
            .animateProperty('sprite', 'rotation', {from: 0, to: 90, duration: 500, ease: 'easeInOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0.25, to: 0, duration: 250, gridUnits: true, delay: 500, ease: 'easeOutCubic'})
            .extraEndDuration(100)
            .waitUntilFinished(-100)
        .effect()
            .file('animated-spell-effects-cartoon.air.puff.01')
            .atLocation(target)
            .scaleToObject(1.5)
            .belowTokens()
            .opacity(0.5)
        .animation()
            .on(target)
            .rotate(90)
            .opacity(1)
        .wait(1500)
        .animation()
            .on(target)
            .rotate(0)
            .opacity(1)
        .play();
    /* eslint-enable indent */
}
function afterimage(token, point, previous, next, delay) {
    const scale = token.texture.scaleX * 0.95;
    /* eslint-disable indent */
    return new Sequence()
        .wait(delay)
        .effect()
            .file('jb2a.impact.002.pinkpurple')
            .atLocation(point)
            .spriteOffset({x: -0.6}, {gridUnits: true})
            .filter('ColorMatrix', {saturate: -1, brightness: 2})
            .filter('Glow', glow)
            .name(afterimageName(token))
            .rotateTowards(previous)
            .size({width: 1, height: 2.5}, {gridUnits: true})
            .zIndex(2)
        .effect()
            .copySprite(token)
            .atLocation(point)
            .tint('#e305ff')
            .name(afterimageName(token))
            .scaleIn(0, 250, {ease: 'easeOutCubic'})
            .fadeOut(250, {ease: 'easeOutCubic'})
            .duration(500)
            .filter('ColorMatrix', {saturate: -1, brightness: 2})
            .filter('Glow', glow)
            .filter('Blur', {blurX: 5, blurY: 10})
            .rotateTowards(next)
            .scale(scale)
            .zIndex(4)
        .effect()
            .copySprite(token)
            .atLocation(point)
            .tint('#e305ff')
            .name(afterimageName(token))
            .filter('ColorMatrix', {saturate: -0.25, brightness: 1.1, contrast: 0.6})
            .scaleIn(0, 250, {ease: 'easeOutCubic'})
            .fadeIn(250)
            .persist()
            .rotateTowards(next)
            .scale(scale)
            .opacity(0.35)
            .zIndex(3)
        .effect()
            .file('animated-spell-effects-cartoon.magic.mind sliver')
            .atLocation(point)
            .stretchTo(next)
            .filter('ColorMatrix', {hue: 70});
    /* eslint-enable indent */
}
const hasFullAnimation = () => animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
async function start(sourceToken, targets, {cameraZoom, sound} = {}) {
    if (!hasFullAnimation()) {
        await Promise.all(targets.map(target => castTouch.macros.play(sourceToken, target, {style: 'strike', color: 'blue', cast: false, shake: true})));
        return;
    }
    await animationUtils.preloadAnimations(files);
    const center = sourceToken.getCenterPoint();
    const aoe = targets.reduce((largest, target) => Math.max(largest, (tokenUtils.getDistance(sourceToken, target) + 5) / 2), 6);
    const radius = (aoe / 2) * sourceToken.parent.grid.size;
    const pointAt = (angle, distance = radius) => ({x: center.x + (distance * Math.cos(angle)), y: center.y + (distance * Math.sin(angle)), angle});
    const initialPoints = [Math.PI / 6, Math.PI * (7 / 6), Math.PI * (11 / 6), Math.PI * (3 / 4), Math.PI * (6 / 4)].map(angle => pointAt(angle));
    const usedAngles = [];
    const points = [];
    for (let i = 0; i < 10; i++) {
        if (i % 2) {
            points.push(pointAt(points.at(-1).angle + Math.PI, radius + 10));
            continue;
        }
        let angle;
        do {
            angle = Math.random() * 2 * Math.PI;
        } while (usedAngles.some(used => Math.abs(used - angle) < (Math.PI / 6)));
        usedAngles.push(angle);
        points.push(pointAt(angle, radius + 10));
    }
    if (cameraZoom) canvas.animatePan({duration: 250, x: center.x, y: center.y, scale: 1.62});
    const vanish = new Sequence();
    /* eslint-disable indent */
    vanish
        .effect()
            .file('animated-spell-effects-cartoon.mix.electric ball.01')
            .atLocation(sourceToken)
            .attachTo(sourceToken)
            .scaleToObject(sourceToken.texture.scaleX * 1.4)
            .filter('ColorMatrix', {hue: 175})
            .mirrorX()
            .waitUntilFinished(-300)
        .effect()
            .file('animated-spell-effects-cartoon.air.portal')
            .atLocation(sourceToken)
            .attachTo(sourceToken)
            .scaleToObject(sourceToken.texture.scaleX * 1.5)
            .filter('ColorMatrix', {saturate: 1, hue: 100})
            .belowTokens()
            .zIndex(0)
        .animation()
            .on(sourceToken)
            .opacity(0);
    /* eslint-enable indent */
    addVanishSprite(vanish, sourceToken, true);
    addVanishSprite(vanish, sourceToken, false).waitUntilFinished(-300);
    vanish.thenDo(() => {
        if (cameraZoom) canvas.animatePan({duration: 50, x: center.x, y: center.y, scale: 0.42});
    });
    await vanish.play();
    const strikes = initialPoints.map((point, index) => {
        const last = index === initialPoints.length - 1;
        const next = last ? sourceToken : initialPoints[index + 1];
        const previous = last ? sourceToken : initialPoints.at(index - 1);
        const sequence = afterimage(sourceToken, point, previous, next, (200 * (index + 1)) - 199);
        if (sound && !last) sequence.sound().file(sound);
        sequence.thenDo(() => targets.forEach(target => shakeTarget(target)));
        if (last) {
            /* eslint-disable indent */
            sequence
                .wait(150)
                .effect()
                    .file('animated-spell-effects-cartoon.air.portal')
                    .atLocation(sourceToken)
                    .attachTo(sourceToken)
                    .scaleToObject(sourceToken.texture.scaleX * 1.5)
                    .mirrorX()
                    .filter('ColorMatrix', {saturate: 1, hue: 100})
                    .belowTokens()
                    .zIndex(0);
            /* eslint-enable indent */
        }
        return sequence.play();
    });
    await Promise.all(strikes);
    for (let i = 0; i < 9; i++) {
        /* eslint-disable indent */
        const slash = new Sequence()
            .effect()
                .file('animated-spell-effects-cartoon.magic.mind sliver')
                .atLocation(points[i])
                .stretchTo(points[i + 1])
                .fadeOut(1000)
                .filter('ColorMatrix', {hue: 70})
                .zIndex(4);
        if (sound) slash.sound().file(sound);
        slash
            .effect()
                .file('animated-spell-effects-cartoon.magic.mind sliver')
                .atLocation(points[9 - i])
                .stretchTo(points[8 - i])
                .fadeOut(1000)
                .filter('ColorMatrix', {hue: 70})
                .playIf(Math.random() < 0.5)
                .zIndex(4)
            .thenDo(() => targets.forEach(target => shakeTarget(target, 0.5)))
            .wait(50);
        /* eslint-enable indent */
        await slash.play();
    }
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('animated-spell-effects-cartoon.magic.mind sliver')
            .atLocation(points[9])
            .stretchTo(points[0])
            .filter('ColorMatrix', {hue: 70})
            .zIndex(4)
        .thenDo(() => targets.forEach(knockDown))
        .wait(400)
        .effect()
            .file('animated-spell-effects-cartoon.electricity.blast.03')
            .atLocation(sourceToken, {offset: {x: aoe / 2, y: -0.5}, gridUnits: true})
            .stretchTo(sourceToken, {offset: {x: aoe / 2 * -1, y: 0.5}, gridUnits: true})
            .filter('ColorMatrix', {hue: 60})
            .filter('ColorMatrix', {saturate: 1.25})
            .zIndex(4)
            .waitUntilFinished(-200)
        .thenDo(() => Sequencer.EffectManager.endEffects({name: afterimageName(sourceToken)}))
        .play();
    /* eslint-enable indent */
}
async function end(sourceToken) {
    if (!hasFullAnimation()) return;
    Sequencer.EffectManager.endEffects({name: afterimageName(sourceToken)});
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('animated-spell-effects-cartoon.air.portal')
            .atLocation(sourceToken)
            .attachTo(sourceToken)
            .scaleToObject(sourceToken.texture.scaleX * 2)
            .filter('ColorMatrix', {saturate: 1, hue: 100})
            .belowTokens()
            .zIndex(0)
        .animation()
            .on(sourceToken)
            .opacity(1)
        .play();
    /* eslint-enable indent */
}
export const steelWindStrike = {
    name: 'CHRISPREMADES.Animations.SteelWindStrike.Name',
    macros: {
        start,
        end
    },
    inputs: ['sourceToken', 'targets', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cameraZoom: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Animations.SteelWindStrike.CameraZoom',
            hint: 'CHRISPREMADES.Animations.SteelWindStrike.CameraZoomHint'
        },
        sound: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Config.Sound',
            hint: 'CHRISPREMADES.Animations.SteelWindStrike.SoundHint'
        }
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
