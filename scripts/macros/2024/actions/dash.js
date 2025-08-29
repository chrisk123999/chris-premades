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
                    .name('Dash Crosshair')
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
                    .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 500, gridUnits: true, ease:'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 1.5, duration: 1000, gridUnits: true, ease:'easeOutBack'})
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
    Sequencer.EffectManager.endEffects({name: 'Dash Crosshair'});
    await genericUtils.sleep(500);
    for (let e = 0; e < positions.length; e++) {
        if (e == 0) {
            /* eslint-disable indent */
            await new Sequence()
                .animation()
                    .on(workflow.token)
                    .opacity(0)
                    .snapToGrid()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.01')
                    .atLocation(workflow.token)
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x:-1}, {gridUnits: true})
                .effect()
                    .file('jb2a.particles.outward.white.01.03')
                    .atLocation(workflow.token)
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .fadeOut(200)
                    .scaleIn(0, 200, {ease: 'easeOutCubic'})
                    .animateProperty('sprite', 'width', {from: 0, to: 2, duration: 500, gridUnits: true, ease: 'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .spriteOffset({x: -1.25}, {gridUnits : true})
                    .zIndex(0.4)
                .effect()
                    .file('jb2a.smoke.puff.side.dark_black.4')
                    .atLocation(workflow.token)
                    .scaleToObject(2)
                    .rotateTowards(positions[e])
                    .fadeOut(200)
                    .opacity(1)
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .spriteRotation(180)
                    .spriteOffset({x: -1.75}, {gridUnits: true})
                    .moveSpeed(1500)
                    .zIndex(0.3)
                .effect()
                    .file('jb2a.energy_strands.range.standard.grey')
                    .atLocation(workflow.token)
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(0.5)
                    .repeats(3,50,50)
                    .spriteOffset({x:0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                .effect()
                    .file('animated-spell-effects-cartoon.magic.mind sliver')
                    .delay(50)
                    .atLocation(workflow.token)
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(1)
                    .spriteOffset({x:0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.21)
                .effect()
                    .copySprite(workflow.token)
                    .name('Dash')
                    .atLocation(workflow.token)
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeOutCirc'})
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(workflow.token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .effect()
                    .delay(200)
                    .copySprite(workflow.token)
                    .scale(workflow.token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease: 'easeOutQuad'})
                    .duration(1000)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
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
        } else if (e == positions.length - 1){
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(positions[e-1])
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .file('jb2a.particles.outward.white.01.03')
                    .atLocation(positions[e-1])
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .fadeOut(200)
                    .scaleIn(0, 200, {ease: 'easeOutCubic'})
                    .animateProperty('sprite', 'width', {from: 0, to: 2, duration: 500, gridUnits: true, ease: 'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .spriteOffset({x: -1.25}, {gridUnits: true})
                    .zIndex(0.4)
                .effect()
                    .file('jb2a.smoke.puff.side.dark_black.4')
                    .atLocation(positions[e-1])
                    .scaleToObject(2)
                    .rotateTowards(positions[e])
                    .fadeOut(200)
                    .opacity(1)
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .spriteRotation(180)
                    .spriteOffset({x: -1.75}, {gridUnits: true})
                    .moveSpeed(1500)
                    .zIndex(0.3)
                .effect()
                    .file('jb2a.energy_strands.range.standard.grey')
                    .atLocation(positions[e-1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(0.5)
                    .repeats(3,50,50)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                .effect()
                    .file('animated-spell-effects-cartoon.magic.mind sliver')
                    .delay(50)
                    .atLocation(positions[e-1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(1)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.21)
                .effect()
                    .copySprite(workflow.token)
                    .name('Dash')
                    .atLocation(positions[e-1])
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeOutCirc'})
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(workflow.token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .effect()
                    .delay(200)
                    .copySprite(workflow.token)
                    .scale(workflow.token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease: 'easeOutQuad'})
                    .duration(1000)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
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
                    .scaleToObject(1.75)
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .file(`jb2a.particles.outward.white.01.03`)
                    .atLocation(positions[e-1])
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .fadeOut(200)
                    .scaleIn(0, 200, {ease: 'easeOutCubic'})
                    .animateProperty('sprite', 'width', {from: 0, to: 2, duration: 500, gridUnits: true, ease:'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease:'easeOutBack'})
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .spriteOffset({x: -1.25}, {gridUnits: true})
                    .zIndex(0.4)
                .effect()
                    .file('jb2a.smoke.puff.side.dark_black.4')
                    .atLocation(positions[e-1])
                    .scaleToObject(2)
                    .rotateTowards(positions[e])
                    .fadeOut(200)
                    .opacity(1)
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .spriteRotation(180)
                    .spriteOffset({x: -1.75}, {gridUnits: true})
                    .moveSpeed(1500)
                    .zIndex(0.3)
                .effect()
                    .file('jb2a.energy_strands.range.standard.grey')
                    .atLocation(positions[e-1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(0.5)
                    .repeats(3,50,50)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                .effect()
                    .file('animated-spell-effects-cartoon.magic.mind sliver')
                    .delay(50)
                    .atLocation(positions[e-1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(1)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.21)
                .effect()
                    .copySprite(workflow.token)
                    .name('Dash')
                    .atLocation(positions[e-1])
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeOutCirc'})
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(workflow.token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .play();
            /* eslint-enable indent */
        } 
    }
}
export let dash = {
    name: 'Dash',
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