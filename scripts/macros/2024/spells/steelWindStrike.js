import {Teleport} from '../../../lib/teleport.js';
import {activityUtils, actorUtils, animationUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') playAnimation = false;
    let sound = itemUtils.getConfig(workflow.item, 'sound');
    if (playAnimation) {
        let animations = [
            'animated-spell-effects-cartoon.mix.electric ball.01',
            'animated-spell-effects-cartoon.air.portal',
            'jb2a.particles.outward.blue.01.03',
            'jb2a.impact.002.pinkpurple',
            'animated-spell-effects-cartoon.magic.mind sliver',
            'animated-spell-effects-cartoon.air.puff.01',
            'animated-spell-effects-cartoon.electricity.blast.03'
        ];
        await animationUtils.preloadAnimations(animations);
        let aoe = 6;
        workflow.targets.forEach(token => {
            let distance = tokenUtils.getDistance(workflow.token, token, {wallsBlock: false, checkCover: false}) + 5;
            if ((distance / 2) > aoe) aoe = distance / 2;
        });
        let cameraZoom = itemUtils.getConfig(workflow.item, 'cameraZoom');
        let targets = Array.from(workflow.targets).filter(i => i != workflow.token);
        let centerX = workflow.token.center.x;
        let centerY = workflow.token.center.y;
        let radius = (aoe / 2) * workflow.token.document.parent.grid.size;
        let points = [];
        let usedAngles = [];
        let angles = [Math.PI / 6, Math.PI * (7 / 6), Math.PI * (11 / 6), Math.PI * (3 / 4),  Math.PI * (6 / 4)];
        let initialPoints = angles.map(angle => {
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
        for (let i = 0; i < 10; i++) {
            let angle;
            if (i % 2 === 0) {
                do {
                    angle = Math.random() * 2 * Math.PI;
                } while (usedAngles.some(a => Math.abs(a - angle) < (Math.PI / 6)));
                usedAngles.push(angle);
            } else {
                angle = (points[points.length - 1].angle + Math.PI);
            }
            let x = centerX + (radius+10) * Math.cos(angle);
            let y = centerY + (radius+10) * Math.sin(angle);
            points.push({x, y, angle});
        }

        if (cameraZoom) canvas.animatePan({duration: 250, x: workflow.token.center.x, y: workflow.token.center.y, scale: 1.620});
        /* eslint-disable indent */
        await new Sequence()
            .effect()
                .file('animated-spell-effects-cartoon.mix.electric ball.01')
                .atLocation(workflow.token, {offset:{x: 0,y: 0}, gridUnits: true})
                .attachTo(workflow.token)
                .scaleToObject(workflow.token.document.texture.scaleX * 1.4)
                .filter('ColorMatrix', {hue: 175})
                .mirrorX()
                .waitUntilFinished(-300)
            .effect()
                .file('animated-spell-effects-cartoon.air.portal')
                .atLocation(workflow.token)
                .attachTo(workflow.token)
                .scaleToObject(workflow.token.document.texture.scaleX * 1.5)
                .filter('ColorMatrix', {saturate: 1, hue: 100})
                .belowTokens()
                .zIndex(0)
            .animation()
                .on(workflow.token)
                .opacity(0)
            .effect()
                .copySprite(workflow.token)
                .atLocation(workflow.token)
                .scaleToObject(1.1)
                .filter('ColorMatrix', {saturate: -1, brightness: 10})
                .filter('Blur', {blurX: 5, blurY: 10})
                .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2})
                .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.75, duration: 300, ease: 'easeOutCubic', gridUnits: true})
                .animateProperty('sprite', 'width', {from: 1, to: 0.025, duration: 300,  ease: 'easeOutCubic', gridUnits: true})
                .animateProperty('sprite', 'height', {from: 1, to: 1.5, duration: 300,  ease: 'easeOutCubic', gridUnits: true})
                .fadeOut(200)
                .duration(400)
                .attachTo(workflow.token, {bindAlpha: false})
            .effect()
                .file('jb2a.particles.outward.blue.01.03')
                .atLocation(workflow.token)
                .scaleToObject(1.1)
                .filter('ColorMatrix', {saturate: -1, brightness: 10})
                .filter('Blur', {blurX: 5, blurY: 10})
                .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2})
                .animateProperty('spriteContainer', 'position.y', {from: 0, to: -0.75, duration: 300, ease: 'easeOutCubic', gridUnits: true})
                .animateProperty('sprite', 'width', {from: 1, to: 0.5, duration: 100,  ease: 'easeOutCubic', gridUnits: true})
                .animateProperty('sprite', 'height', {from: 1, to: 1.5, duration: 300,  ease: 'easeOutCubic', gridUnits: true})
                .fadeOut(200)
                .duration(400)
                .attachTo(workflow.token, {bindAlpha: false})
                .waitUntilFinished(-300)
            .thenDo(() => {
                if (cameraZoom) canvas.animatePan({duration: 50, x: workflow.token.center.x, y: workflow.token.center.y, scale: 0.420});
            })
            .play();
        /* eslint-enable indent */
        for (let e = 0; e < 10; e++) {
            if (e == 0) {
                for (let u = 0; u < 5; u++) {
                    if (u === 4) {
                        /* eslint-disable indent */
                        await new Sequence()
                            .wait(200 * (u + 1) - 199)
                            .effect()
                                .file('jb2a.impact.002.pinkpurple')
                                .atLocation(initialPoints[u])
                                .spriteOffset({x: -0.6}, {gridUnits: true})
                                .filter('ColorMatrix', {saturate: -1, brightness: 2})
                                .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1})
                                .name(workflow.item.name)
                                .rotateTowards(workflow.token)
                                .size({width: 1, height: 2.5}, {gridUnits: true})
                                .opacity(1)
                                .zIndex(2)
                            .effect()
                                .copySprite(workflow.token)
                                .atLocation(initialPoints[u])
                                .tint('#e305ff')
                                .name(workflow.item.name)
                                .scaleIn(0, 250, {ease: 'easeOutCubic'})
                                .fadeOut(250,{ease: 'easeOutCubic'})
                                .duration(500)
                                .filter('ColorMatrix', {saturate: -1, brightness: 2})
                                .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1})
                                .filter('Blur', {blurX: 5, blurY: 10})
                                .rotateTowards(workflow.token)
                                .scale(workflow.token.document.texture.scaleX*0.95)
                                .opacity(1)
                                .zIndex(4)
                            .effect()
                                .copySprite(workflow.token)
                                .atLocation(initialPoints[u])
                                .tint('#e305ff')
                                .name(workflow.item.name)
                                .filter('ColorMatrix', {saturate: -0.25, brightness:1.1, contrast: 0.6})
                                .scaleIn(0, 250, {ease: 'easeOutCubic'})
                                .fadeIn(250)
                                .persist()
                                .rotateTowards(workflow.token)
                                .scale(workflow.token.document.texture.scaleX * 0.95)
                                .opacity(0.35)
                                .zIndex(3)
                            .effect()
                                .file('animated-spell-effects-cartoon.magic.mind sliver')
                                .atLocation(initialPoints[u])
                                .stretchTo(workflow.token)
                                .filter('ColorMatrix', {hue: 70})
                            .thenDo(() => {
                                targets.forEach(target => { 
                                    new Sequence()
                                        .animation()
                                            .on(target)
                                            .opacity(1)
                                            .effect()
                                            .copySprite(target)
                                            .atLocation(target)
                                            .animateProperty('sprite', 'position.y', {from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false})
                                            .animateProperty('sprite', 'position.y', {from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90})
                                            .extraEndDuration(30)
                                            .filter('Blur', {blurX: 0, blurY: 5})
                                            .opacity(0.35)
                                        .effect()
                                            .file('jb2a.impact.009.purple')
                                            .atLocation(target, {randomOffset:1, gridUnits: true})
                                            .randomRotation()
                                            .filter('ColorMatrix', {saturate: -0.4})
                                            .scaleToObject(1)
                                            .zIndex(0)
                                        .play();
                                });        
                            })
                            .wait(150)
                            .effect()
                                .file('animated-spell-effects-cartoon.air.portal')
                                .atLocation(workflow.token)
                                .attachTo(workflow.token)
                                .scaleToObject(workflow.token.document.texture.scaleX * 1.5)
                                .mirrorX()
                                .filter('ColorMatrix', {saturate: 1, hue: 100})
                                .belowTokens()
                                .zIndex(0)
                            .play();
                    /* eslint-enable indent */
                    } else {
                        /* eslint-disable indent */
                        new Sequence()
                            .wait(200 * (u + 1) - 199)
                            .effect()
                                .file('jb2a.impact.002.pinkpurple')
                                .atLocation(initialPoints[u])
                                .spriteOffset({x: -0.6}, {gridUnits: true})
                                .filter('ColorMatrix', {saturate: -1, brightness: 2})
                                .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1})
                                .name(workflow.item.name)
                                .rotateTowards(initialPoints[Math.max(1,(u - 1))])
                                .size({width: 1, height: 2.5}, {gridUnits: true})
                                .opacity(1)
                                .zIndex(2)
                            .effect()
                                .copySprite(workflow.token)
                                .atLocation(initialPoints[u])
                                .tint('#e305ff')
                                .name(workflow.item.name)
                                .scaleIn(0, 250, {ease: 'easeOutCubic'})
                                .fadeOut(250,{ease: 'easeOutCubic'})
                                .duration(500)
                                .filter('ColorMatrix', {saturate: -1, brightness: 2})
                                .filter('Glow', {color: 0xbb00ff, distance: 2, outerStrength: 2, innerStrength: -1})
                                .filter('Blur', {blurX: 5, blurY: 10})
                                .rotateTowards(initialPoints[(u + 1)])
                                .scale(workflow.token.document.texture.scaleX * 0.95)
                                .opacity(1)
                                .zIndex(4)
                            .effect()
                                .copySprite(workflow.token)
                                .atLocation(initialPoints[u])
                                .tint('#e305ff')
                                .name(workflow.item.name)
                                .filter('ColorMatrix', {saturate: -0.25, brightness: 1.1, contrast: 0.6})
                                .scaleIn(0, 250, {ease: 'easeOutCubic'})
                                .fadeIn(250)
                                .persist()
                                .rotateTowards(initialPoints[(u + 1)])
                                .scale(workflow.token.document.texture.scaleX * 0.95)
                                .opacity(0.35)
                                .zIndex(3)
                            .effect()
                                .file('animated-spell-effects-cartoon.magic.mind sliver')
                                .atLocation(initialPoints[u])
                                .stretchTo(initialPoints[(u + 1)])
                                .filter('ColorMatrix', {hue: 70})
                            .sound()
                                .playIf(sound)
                                .file(sound)
                            .thenDo(() => {
                                targets.forEach(target => { 
                                    new Sequence()
                                        .effect()
                                            .copySprite(target)
                                            .atLocation(target)
                                            .animateProperty('sprite', 'position.y', {from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false})
                                            .animateProperty('sprite', 'position.y', {from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90})
                                            .extraEndDuration(30)
                                            .filter('Blur', {blurX: 0, blurY: 5})
                                            .opacity(0.35)
                                        .effect()
                                            .file('jb2a.impact.009.purple')
                                            .atLocation(target, {randomOffset: 1, gridUnits: true})
                                            .randomRotation()
                                            .scaleToObject(1)
                                            .filter('ColorMatrix', {saturate: -0.4})
                                            .zIndex(0)
                                        .play();
                                });        
                            })
                            .play();
                        /* eslint-enable indent */
                    }
                }
            }
            if (e === 9) {
                /* eslint-disable indent */
                await new Sequence()
                    .effect()
                        .name('location')
                        .file('animated-spell-effects-cartoon.magic.mind sliver')
                        .atLocation(points[e])
                        .stretchTo(points[0])
                        .filter('ColorMatrix', {hue: 70})
                        .zIndex(4)
                    .thenDo(() => {
                        targets.forEach(target => { 
                            new Sequence()
                                .effect()
                                    .copySprite(target)
                                    .atLocation(target)
                                    .animateProperty('sprite', 'position.y', {from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false})
                                    .animateProperty('sprite', 'position.y', {from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90})
                                    .extraEndDuration(30)
                                    .filter('Blur', {blurX: 0, blurY: 5})
                                    .opacity(0.35)
                                .effect()
                                    .file('jb2a.impact.009.purple')
                                    .atLocation(target,{gridUnits: true})
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
                                    .animateProperty('sprite', 'scale.x', {from: 1, to: 1.1, duration: 250,delay: 500,ease: 'easeOutCubic'})
                                    .animateProperty('sprite', 'scale.y', {from: 1, to: 1.1, duration: 250,delay: 500,ease: 'easeOutCubic'})
                                    .opacity(0.5)
                                    .belowTokens()
                                .effect()
                                    .copySprite(target)
                                    .atLocation(target, {local:true})
                                    .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 500, gridUnits: true, ease: 'easeOutCubic'})
                                    .animateProperty('sprite', 'rotation', {from: 0, to: 90, duration: 500,ease: 'easeInOutBack'})
                                    .animateProperty('sprite', 'position.y', {from: 0.25, to: 0, duration: 250, gridUnits: true, delay: 500,ease: 'easeOutCubic'})
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
                        });        
                    })
                    .wait(400)
                    .effect()
                        .file('animated-spell-effects-cartoon.electricity.blast.03')
                        .atLocation(workflow.token, {offset: {x: aoe / 2, y: -0.5}, gridUnits: true})
                        .stretchTo(workflow.token, {offset: {x: aoe / 2 * -1, y: 0.5}, gridUnits: true})
                        .filter('ColorMatrix', {hue: 60})
                        .filter('ColorMatrix', {saturate: 1.25})
                        .zIndex(4)
                        .waitUntilFinished(-200)
                    .thenDo(() => {
                        Sequencer.EffectManager.endEffects({name: workflow.item.name});
                    })
                    .play();

            /* eslint-enable indent */
            } else {
                /* eslint-disable indent */
                await new Sequence()
                    .effect()
                        .file('animated-spell-effects-cartoon.magic.mind sliver')
                        .atLocation(points[e])
                        .stretchTo(points[e + 1])
                        .fadeOut(1000)
                        .filter('ColorMatrix', {hue: 70})
                        .zIndex(4)
                    .sound()
                            .playIf(sound)
                            .file(sound)
                    .effect()
                        .file('animated-spell-effects-cartoon.magic.mind sliver')
                        .atLocation(points[9 - e])
                        .stretchTo(points[9 - e - 1])
                        .fadeOut(1000)
                        .filter('ColorMatrix', {hue: 70})
                        .playIf(Math.random() < 0.5)
                        .zIndex(4)
                    .thenDo(function(){
                        targets.forEach(target => { 
                            new Sequence()
                                .effect()
                                    .copySprite(target)
                                    .atLocation(target)
                                    .animateProperty('sprite', 'position.y', {from: 0, to: -0.1, duration: 60, gridUnits: true, fromEnd: false})
                                    .animateProperty('sprite', 'position.y', {from: 0, to: 0.1, duration: 60, gridUnits: true, fromEnd: false, delay: 90})
                                    .extraEndDuration(30)
                                    .filter('Blur', {blurX: 0, blurY: 5})
                                    .opacity(0.35)
                                .effect()
                                    .file('jb2a.impact.009.purple')
                                    .atLocation(target, {randomOffset: 1, gridUnits: true})
                                    .randomRotation()
                                    .scaleToObject(1)
                                    .filter('ColorMatrix', {saturate: -0.4})
                                    .playIf(Math.random() < 0.5)
                                    .zIndex(0)
                                .play();
                        });        
                    })
                    .wait(50)
                    .play();
                /* eslint-enable indent */
            }
        }
    }
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'attack', {strict: true});
    if (activity) {
        for (let token of workflow.targets) await workflowUtils.syntheticActivityRoll(activity, [token]);
    }
    await Teleport.target([workflow.token], workflow.token, {range: workflow.activity.range.value + 5, animation: 'none'});
    if (!playAnimation) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('animated-spell-effects-cartoon.air.portal')
            .atLocation(workflow.token)
            .attachTo(workflow.token)
            .scaleToObject(workflow.token.document.texture.scaleX * 2)
            .filter('ColorMatrix', {saturate: 1, hue: 100})
            .belowTokens()
            .zIndex(0)
        .animation()
            .on(workflow.token)
            .opacity(1)
        .play();
    /* eslint-enable indent */
}
export let steelWindStrike = {
    name: 'Steel Wind Strike',
    version: '1.4.41',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
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
            value: 'cameraZoom',
            label: 'CHRISPREMADES.Config.cameraZoom',
            type: 'checkbox',
            default: false,
            category: 'animation'
        },
        {
            value: 'sound',
            label: 'CHRISPREMADES.Config.Sound',
            type: 'file',
            default: '',
            category: 'animation'
        }
    ]
};