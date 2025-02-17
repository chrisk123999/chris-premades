import {animationUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') return;
    let target = workflow.targets.first();
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file('jb2a.healing_generic.03.burst.bluepurple')
            .attachTo(target, {offset: {y: -0.45 * target.document.width}, gridUnits: true})
            .scaleToObject(1.25, {considerTokenScale: true})
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .filter('ColorMatrix', {saturate: -0.5, hue: -50})
            .rotate(180)
            .zIndex(2)
        .effect()
            .delay(1000)
            .file('jb2a.healing_generic.03.burst.bluepurple')
            .attachTo(target)
            .scaleToObject(2.2, {considerTokenScale: true})
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .startTime(1000)
            .filter('ColorMatrix', {saturate: -0.5, hue: -50})
            .zIndex(1)
        .effect()
            .delay(1000)
            .file('jb2a.wind_stream.200.white')
            .attachTo(target, {followRotation: false})
            .scaleToObject(1.8, {considerTokenScale: true})
            .rotate(90)
            .opacity(2)
            .mask()
            .duration(1500)
            .fadeOut(1000)
        .effect()
            .delay(1250)
            .file('jb2a.twinkling_stars.points04.white')
            .attachTo(target, {offset: {x: 0.3 * target.document.width, y: 0.1 * target.document.width}, gridUnits: true, randomOffset: 0.5, followRotation: false})
            .scaleToObject(0.3, {considerTokenScale: true})
            .filter('ColorMatrix', {saturate:1, hue: 110})
            .scaleIn(0, 250, {ease: 'easeOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 500, ease: 'easeOutCubic', gridUnits: true})
            .fadeOut(100)
            .duration(600)
            .repeats(3, 250,250)
            .zIndex(1)
        .effect()
            .delay(1500)
            .file('jb2a.twinkling_stars.points04.white')
            .attachTo(target, {offset: {x: -0.3 * target.document.width, y: 0.1 * target.document.width}, gridUnits: true, randomOffset: 0.5, followRotation: false})
            .scaleToObject(0.3, {considerTokenScale: true})
            .filter('ColorMatrix', {saturate: 1, hue: 110})
            .scaleIn(0, 250, {ease: 'easeOutBack'})
            .animateProperty('sprite', 'position.y', {from: 0, to: -0.25, duration: 500, ease: 'easeOutCubic', gridUnits: true})
            .fadeOut(100)
            .duration(600)
            .repeats(3, 250,250)
            .zIndex(1)
        .effect()
            .delay(1000)
            .file('jb2a.twinkling_stars.points08.white')
            .attachTo(target, {offset: {y: -0.45 * target.document.width}, gridUnits: true})
            .scaleToObject(0.65)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .duration(3500)
            .fadeOut(1000)
            .zIndex(1)
        .effect()
            .delay(1000)
            .file('jb2a.particles.outward.white.02.03')
            .attachTo(target, {offset: {y:-0.5}, gridUnits: true})
            .scaleToObject(0.7, {gridUnits: true})
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .filter('ColorMatrix', {saturate:-1})
            .duration(6500)
            .fadeOut(1000)
            .zIndex(0.1)
        .effect()
            .file('jb2a.ward.star.yellow.01')
            .attachTo(target)
            .scaleToObject(2)
            .fadeIn(500)
            .filter('ColorMatrix', {brightness: 0})
            .opacity(0.5)
            .duration(4500)
            .fadeOut(1000)
            .belowTokens()
            .zIndex(0)
        .play();
    /* eslint-enable indent */
}
export let vigilantBlessing = {
    name: 'Vigilant Blessing',
    version: '1.1.0',
    hasAnimation: true,
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
        }
    ]
};