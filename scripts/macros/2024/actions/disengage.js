import {animationUtils, crosshairUtils, genericUtils, itemUtils} from '../../../utils.js';
async function stepOfTheWind(token, positions) {
    for (let e = 0; e < positions.length; e++) {
        if (e == 0) {
            /* eslint-disable indent */
            await new Sequence()
                .animation()
                    .on(token)
                    .opacity(0)
                    .snapToGrid()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.69')
                    .atLocation(token)
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .belowTokens()
                    .opacity(0.85)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                .effect()
                    .file('jb2a.particles.outward.blue.01.03')
                    .atLocation(token)
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .fadeOut(200)
                    .scaleIn(0, 200, {ease: 'easeOutCubic'})
                    .animateProperty('sprite', 'width', {from: 0, to: 2, duration: 500, gridUnits: true, ease:'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease:'easeOutBack'})
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .spriteOffset({x: -1.25}, {gridUnits: true})
                    .zIndex(0.4)
                .effect()
                    .file('jb2a.energy_strands.range.standard.grey')
                    .atLocation(token)
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(0.65)
                    .repeats(3,50,50)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {brightness: 1.2})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                .effect()
                    .file('jb2a.swirling_leaves.ranged.blue')
                    .delay(50)
                    .atLocation(token)
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(1)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .randomizeMirrorY()
                    .endTime(1300)
                    .fadeOut(500)
                    .zIndex(0.21)
                    .playbackRate(2.25)
                .effect()
                    .copySprite(token)
                    .name('StepOfTheWind Dash')
                    .atLocation(token)
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeInCirc'})
                    .fadeOut(400)
                    .opacity(0.5)
                    .scale(token.document.texture.scaleX)
                    .filter('Blur', {blurX: 10, blurY: 5})
                    .spriteOffset({x: -0.05}, {gridUnits: true})
                    .zIndex(0.1)
                .effect()
                    .copySprite(token)
                    .name('StepOfTheWind Dash')
                    .atLocation(token)
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeInCirc'})
                    .fadeOut(0)
                    .scale(token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .effect()
                    .delay(200)
                    .copySprite(token)
                    .scale(token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease: 'easeOutQuad'})
                    .duration(1000)
                    .opacity(1)
                    .playIf(positions.length == 1)
                .animation()
                    .delay(200)
                    .on(token)
                    .teleportTo(positions[e])
                    .snapToGrid()
                    .opacity(1)
                    .playIf(positions.length == 1)
                .play();
            /* eslint-enable indent */
            if (positions.length === 1) await token.actor.sheet.maximize();
        } else if (e == positions.length - 1){
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.69')
                    .atLocation(positions[e - 1])
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .belowTokens()
                    .opacity(0.85)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .file(`jb2a.particles.outward.blue.01.03`)
                    .atLocation(positions[e - 1])
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .fadeOut(200)
                    .scaleIn(0, 200, {ease: 'easeOutCubic'})
                    .animateProperty('sprite', 'width', {from: 0, to: 2, duration: 500, gridUnits: true, ease: 'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack'})
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .spriteOffset({x: -1.25}, {gridUnits: true})
                    .zIndex(0.4)
                .effect()
                    .file('jb2a.energy_strands.range.standard.grey')
                    .atLocation(positions[e - 1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(0.75)
                    .repeats(3,50,50)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {brightness: 1.2})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                .effect()
                    .file('jb2a.swirling_leaves.ranged.blue')
                    .delay(50)
                    .atLocation(positions[e - 1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(1)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .randomizeMirrorY()
                    .endTime(1300)
                    .fadeOut(500)
                    .zIndex(0.21)
                    .playbackRate(2.25)
                .effect()
                    .copySprite(token)
                    .name('StepOfTheWind Dash')
                    .atLocation(positions[e - 1])
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeInCirc'})
                    .fadeOut(0)
                    .scale(token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .effect()
                    .delay(200)
                    .copySprite(token)
                    .scale(token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease: 'easeOutQuad'})
                    .duration(1000)
                    .opacity(1)
                .animation()
                    .delay(200)
                    .on(token)
                    .teleportTo(positions[e])
                    .snapToGrid()
                    .opacity(1)
                .play();
            /* eslint-enable indent */
            await token.actor.sheet.maximize();
        } else {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.69')
                    .atLocation(positions[e - 1])
                    .rotateTowards(positions[e])
                    .scaleToObject(1.75)
                    .belowTokens()
                    .opacity(0.85)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .file('jb2a.particles.outward.blue.01.03')
                    .atLocation(positions[e - 1])
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
                    .file('jb2a.energy_strands.range.standard.grey')
                    .atLocation(positions[e - 1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(0.75)
                    .repeats(3,50,50)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .filter('ColorMatrix', {brightness: 1.2})
                    .randomizeMirrorY()
                    .fadeOut(200)
                    .zIndex(0.2)
                .effect()
                    .file('jb2a.swirling_leaves.ranged.blue')
                    .delay(50)
                    .atLocation(positions[e - 1])
                    .stretchTo(positions[e])
                    .belowTokens()
                    .opacity(1)
                    .spriteOffset({x: 0}, {gridUnits: true})
                    .randomizeMirrorY()
                    .endTime(1300)
                    .fadeOut(500)
                    .zIndex(0.21)
                    .playbackRate(2.25)
                .effect()
                    .copySprite(token)
                    .name('StepOfTheWind Dash')
                    .atLocation(positions[e - 1])
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeInCirc'})
                    .fadeOut(0)
                    .scale(token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .play();
            /* eslint-enable indent */
        } 
    }
}
async function cunningAction(token, positions) {
    for (let e = 0; e < positions.length; e++) {
        if(e == 0) {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(token)
                    .rotateTowards(positions[e])
                    .size(token.document.width * 1.75, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .animation()
                    .on(token)
                    .opacity(0)
                    .snapToGrid()
                .effect()
                    .copySprite(token)
                    .name('Disengage')
                    .atLocation(token)
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .duration(1500)
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(token.document.texture.scaleX * 0.9)
                    .filter('ColorMatrix', {brightness: -1})
                    .filter('Blur', {blurX: 5, blurY: 10})
                    .opacity(0.6)
                    .scaleIn(0.5, 300, {ease: 'easeOutCubic'})
                    .belowTokens()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.99')
                    .atLocation(positions[e])
                    .rotateTowards(token)
                    .delay(800)
                    .size(token.document.width * token.document.texture.scaleX * 1.5, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteOffset({x: -1.15}, {gridUnits: true})
                    .spriteRotation(-90)
                .effect()
                    .copySprite(token)
                    .name('Disengage')
                    .atLocation(token)
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .duration(1500)
                    .fadeOut(0)
                    .scale(token.document.texture.scaleX)
                    .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 300, gridUnits: true, ease: 'linear'})
                    .animateProperty('sprite', 'position.y', {from: 0, to: 0.25, duration: 500, gridUnits: true, delay: 300, ease: 'linear'})
                    .animateProperty('sprite', 'rotation', {from: 0, to: 360, duration: 600, ease: 'easeOutCirc'})
                    .waitUntilFinished(-300)
                .effect()
                    .copySprite(token)
                    .scale(token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .duration(500)
                    .opacity(1)
                    .playIf(positions.length > 1)
                .effect()
                    .delay(200)
                    .copySprite(token)
                    .scale(token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease:'easeOutQuad'})
                    .duration(1000)
                    .opacity(1)
                    .playIf(positions.length == 1)
                .animation()
                    .delay(200)
                    .on(token)
                    .teleportTo(positions[e])
                    .snapToGrid()
                    .opacity(1)
                    .playIf(positions.length == 1)
                .play();
            /* eslint-enable indent */
            if (positions.length === 1) await token.actor.sheet.maximize();
        } else if (e == positions.length - 1) {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(positions[e - 1])
                    .rotateTowards(positions[e])
                    .size(token.document.width * 1.75, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .copySprite(token)
                    .name('Disengage')
                    .atLocation(positions[e - 1])
                    .moveTowards(positions[e],{rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease: 'easeOutCirc'})
                    .fadeOut(0)
                    .scale(token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .effect()
                    .delay(200)
                    .copySprite(token)
                    .scale(token.document.texture.scaleX)
                    .atLocation(positions[e])
                    .fadeOut(500, {ease: 'easeOutQuad'})
                    .duration(1000)
                    .opacity(1)
                .animation()
                    .delay(200)
                    .on(token)
                    .teleportTo(positions[e])
                    .snapToGrid()
                    .opacity(1)
                .play();
            /* eslint-enable indent */
            await token.actor.sheet.maximize();
        } else {
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('animated-spell-effects-cartoon.smoke.43')
                    .atLocation(positions[e - 1])
                    .rotateTowards(positions[e])
                    .size(token.document.width * 1.75, {gridUnits: true})
                    .belowTokens()
                    .opacity(0.65)
                    .scaleIn(0, 300, {ease: 'easeOutExpo'})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .spriteRotation(-90)
                    .spriteOffset({x: -1}, {gridUnits: true})
                    .randomRotation()
                .effect()
                    .copySprite(token)
                    .name('Disengage')
                    .atLocation(positions[e - 1])
                    .moveTowards(positions[e], {rotate: false, ease: 'easeOutCirc'})
                    .moveSpeed(1500)
                    .duration(400)
                    .fadeIn(400, {ease:'easeOutCirc'})
                    .fadeOut(0)
                    .filter('ColorMatrix', {saturate: -0.25, brightness: 0.65})
                    .scale(token.document.texture.scaleX)
                    .waitUntilFinished(-300)
                .play();
            /* eslint-enable indent */
        } 
    }
}
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || animationUtils.jb2aCheck() != 'patreon' || !animationUtils.aseCheck()) return;
    let displayHint = itemUtils.getConfig(workflow.item, 'displayHint');
    if (displayHint) genericUtils.notify('CHRISPREMADES.Macros.Dash.Notify', 'info', {localize: true});
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let fade = animation === 'cunningAction' ? 'jb2a.particles.outward.purple.01.03' : 'jb2a.particles.outward.blue.01.03';
    await workflow.actor.sheet.minimize();
    let positions = [];
    let i = 0;
    let cancelled = false;
    while (!cancelled) {
        positions[i] = await crosshairUtils.aimCrosshair({
            token: workflow.token, 
            maxRange: workflow.actor.system.attributes.movement.walk, 
            centerpoint: workflow.token.center, 
            drawBoundries: true, 
            trackDistance: true, 
            fudgeDistance: workflow.token.document.width * canvas.dimensions.distance / 2,
            crosshairsConfig: {
                size: workflow.token.document.parent.grid.distance * workflow.token.document.width / 2,
                icon: workflow.token.document.texture.src,
                resolution: (workflow.token.document.width % 2) ? 1 : -1
            }
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
                    .file(fade)
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
    if (animation === 'cunningAction') {
        await cunningAction(workflow.token, positions);
    } else {
        await stepOfTheWind(workflow.token, positions);
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
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'cunningAction',
            category: 'animation',
            options: [
                {
                    value: 'stepOfTheWind',
                    label: 'CHRISPREMADES.Macros.Disengage.StepOfTheWind',
                    requiredModules: ['jb2a_patreon', 'animated-spell-effects-cartoon']
                },
                {
                    value: 'cunningAction',
                    label: 'CHRISPREMADES.Macros.Disengage.CunningAction',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
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
    hasAnimation: true,
    utilFunctions: {
        cunningAction,
        stepOfTheWind
    }
};