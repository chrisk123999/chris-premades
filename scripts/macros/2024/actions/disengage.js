import {Crosshairs} from '../../../lib/crosshairs.js';
import {animationUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || animationUtils.jb2aCheck() != 'patreon' || !animationUtils.aseCheck()) return;
    let displayHint = itemUtils.getConfig(workflow.item, 'displayHint');
    if (displayHint) genericUtils.notify('CHRISPREMADES.Macros.Dash.Notify', 'info', {localize: true});
    await workflow.actor.sheet.minimize();
    let positions = [];
    let i = 0;
    let cancelled = false;
    while (!cancelled) {
        positions[i] = await Crosshairs.showCrosshairs({
            interval: workflow.token.width % 2 === 0 ? 1 : -1,
            size: canvas.grid.distance * workflow.token.document.width / 2,
            resolution: (workflow.token.document.width % 2) ? 1 : -1,
            icon: workflow.token.document.texture.src,
            rememberControlled: true
        });
        if (positions[i].cancelled) {
            positions.push(positions[i]);
            i++;
            /* eslint-disable indent */
            new Sequence()
                .effect()
                    .name('Disengage Crosshair')
                    .copySprite(workflow.token)
                    .atLocation(positions[i])
                    .fadeIn(100)
                    .persist()
                    .opacity(0.65)
                    .locally()
                    .loopProperty('alphaFilter', 'alpha', {from: 1, to: 0.75, duration: 1500, pingPong: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0.5})
                    .scale(workflow.token.document.texture.scaleX)
                    .fadeIn(250)
                    .fadeOut(500)
                    .waitUntilFinished(-500)
                .effect()
                    .file('jb2a.particles.outward.purple.01.03')
                    .atLocation(positions[i])
                    .scale(0.15 * workflow.token.document.texture.scaleX)
                    .duration(1000)
                    .fadeOut(500)
                    .scaleIn(0, 1000, {ease: 'easeOutCubic'})
                    .filter('ColorMatrix', {hue: 0})
                    .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 500, gridUnits: true, ease: 'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 1.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
                    .animateProperty('sprite', 'position.y', {from: 0, to: -1, duration: 1000, gridUnits: true})
                    .zIndex(0.2)
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .locally()
                .play();
            /* eslint-enable indent */
        } else {
            cancelled = true;
        }
    }
    Sequencer.EffectManager.endEffects({name: 'Disengage Crosshair'});
    await genericUtils.sleep(500);
    for (let e = 0; e < positions.length; e++) {
        if(e == 0) {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(workflow.token)
                    .rotateTowards(positions[e])
                    .size(workflow.token.document.width * 1.75, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x:-1}, {gridUnits: true})
                    .randomRotation()
                .animation()
                    .on(workflow.token)
                    .opacity(0)
                    .snapToGrid()
                .effect()
                    .copySprite(workflow.token)
                    .name('Disengage')
                    .atLocation(workflow.token)
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .duration(1500)
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(workflow.token.document.texture.scaleX * 0.9)
                    .filter('ColorMatrix', {brightness: -1})
                    .filter('Blur', {blurX: 5, blurY: 10})
                    .opacity(0.6)
                    .scaleIn(0.5, 300, {ease: 'easeOutCubic'})
                    .belowTokens()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.99')
                    .atLocation(positions[e])
                    .rotateTowards(workflow.token)
                    .delay(800)
                    .size(workflow.token.document.width * workflow.token.document.texture.scaleX * 1.5, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteOffset({x: -1.15}, {gridUnits: true})
                    .spriteRotation(-90)
                .effect()
                    .copySprite(workflow.token)
                    .name('Disengage')
                    .atLocation(workflow.token)
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .duration(1500)
                    .fadeOut(0)
                    .scale(workflow.token.document.texture.scaleX)
                    .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 300, gridUnits: true, ease: 'linear'})
                    .animateProperty('sprite', 'position.y', {from: 0, to: 0.25, duration: 500, gridUnits: true, delay: 300, ease: 'linear'})
                    .animateProperty('sprite', 'rotation', {from: 0, to: 360, duration: 600, ease: 'easeOutCirc'})
                    .waitUntilFinished(-300)
                .effect()
                    .copySprite(workflow.token)
                    .scale(workflow.token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .duration(500)
                    .opacity(1)
                    .playIf(positions.length > 1)
                .effect()
                    .delay(200)
                    .copySprite(workflow.token)
                    .scale(workflow.token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease:'easeOutQuad'})
                    .duration(1000)
                    .opacity(1)
                    .playIf(positions.length == 1)
                .animation()
                    .delay(200)
                    .on(workflow.token)
                    .teleportTo(positions[e])
                    .snapToGrid()
                    .opacity(1)
                    .playIf(positions.length == 1)
                .play();
            /* eslint-enable indent */
            if (positions.length === 1) await workflow.actor.sheet.maximize();
        } else if (e == positions.length - 1) {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(positions[e-1])
                    .rotateTowards(positions[e])
                    .size(workflow.token.document.width * 1.75, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .copySprite(workflow.token)
                    .name('Disengage')
                    .atLocation(positions[e-1])
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeOutCirc'})
                    .fadeOut(0)
                    .scale(workflow.token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .effect()
                    .delay(200)
                    .copySprite(workflow.token)
                    .scale(workflow.token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease: 'easeOutQuad'})
                    .duration(1000)
                    .opacity(1)
                .animation()
                    .delay(200)
                    .on(workflow.token)
                    .teleportTo(positions[e])
                    .snapToGrid()
                    .opacity(1)
                .play();
            /* eslint-enable indent */
            await workflow.actor.sheet.maximize();
        } else {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(positions[e-1])
                    .rotateTowards(positions[e])
                    .size(workflow.token.document.width * 1.75, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .copySprite(workflow.token)
                    .name('Disengage')
                    .atLocation(positions[e-1])
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease:'easeOutCirc'})
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(workflow.token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .play();
            /* eslint-enable indent */
        } 
    }
}
export let disengage = {
    name: 'Disengage',
    version: '1.3.34',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'displayHint',
            label: 'CHRISPREMADES.Config.DisplayHint',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    hasAnimation: true
};