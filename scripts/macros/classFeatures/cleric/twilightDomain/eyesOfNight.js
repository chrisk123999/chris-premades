import {animationUtils, itemUtils, tokenUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) return;
    if (!animationUtils.aseCheck() || animationUtils.jb2aCheck() != 'patreon') return;
    let targets = Array.from(workflow.targets).sort((a, b) => tokenUtils.getDistance(workflow.token, a) - tokenUtils.getDistance(workflow.token, b));
    let targetOrder = [workflow.token];
    let targetOffsetX = [0];
    let targetOffsetY = [0];
    function generateRandomOffset() {
        return (Math.random() - 0.5) * 0.6;
    }
    for (let i = 0; i < targets.length; i++) {
        let lastAdded = targetOrder[targetOrder.length - 1];
        let closestDistance = Infinity;
        let closestIndex = -1;
        for (let j = 0; j < targets.length; j++) {
            if (targetOrder.includes(targets[j])) continue;
            let distance = tokenUtils.getDistance(lastAdded, targets[j]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = j;
            }
        }
        if (closestIndex !== -1) {
            targetOrder.push(targets[closestIndex]);
            targetOffsetX.push(generateRandomOffset());
            targetOffsetY.push(generateRandomOffset());
        }
    }
    /* eslint-disable indent */
    new Sequence()
        .wait(250)
        .effect()
            .file('jb2a.healing_generic.03.burst.bluepurple')
            .attachTo(workflow.token)
            .scaleToObject(2.2, {considerTokenScale: true})
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .startTime(1000)
            .filter('ColorMatrix', {saturate:-0.5, hue: -50})
            .zIndex(1)
        .effect()
            .file('animated-spell-effects-cartoon.misc.all seeing eye')
            .attachTo(workflow.token)
            .scaleToObject(0.6, {gridUnits: true})
            .filter('ColorMatrix', {saturate: -1, hue: 105})
            .scaleIn(0, 500, {ease: 'easeOutBack'})
            .scaleOut(0, 500, {ease: 'easeOutCubic'})
            .duration(2500)
            .zIndex(0.1)
        .effect()
            .file('jb2a.twinkling_stars.points08.white')
            .attachTo(workflow.token)
            .scaleToObject(0.75, {gridUnits: true})
            .scaleIn(0, 500, {ease: 'easeOutBack'})
            .scaleOut(0, 500, {ease: 'easeOutCubic'})
            .duration(2500)
            .zIndex(1)
        .effect()
            .file('animated-spell-effects-cartoon.energy.pulse.yellow')
            .attachTo(workflow.token, {offset: {x: 0}, gridUnits: true})
            .scaleToObject(0.7, {gridUnits: true})
            .filter('ColorMatrix', {saturate:-1})
            .zIndex(1)
        .play();
    for (let u = 0; u < targetOrder.length; u++) {
        if (u+1 < targetOrder.length) {
            new Sequence()
                .wait(500+100*u)
                .effect()
                    .file('jb2a.energy_beam.normal.yellow.03')
                    .atLocation(targetOrder[u], {offset: {x: targetOffsetX[u], y: targetOffsetY[u]}, gridUnits: true})
                    .stretchTo(targetOrder[u+1], {offset: {x: targetOffsetX[u+1], y: targetOffsetY[u+1]}, gridUnits: true, onlyX: true})
                    .scale(0.1)
                    .duration(2000)
                    .fadeIn(500)
                    .fadeOut(500)
                    .filter('ColorMatrix', {saturate: -1, brightness: 1.1})
                    .opacity(1)
                .effect()
                    .delay(10 + 100 * u)
                    .file('jb2a.twinkling_stars.points04.white')
                    .attachTo(targetOrder[u+1], {offset: {x: targetOffsetX[u+1], y: targetOffsetY[u+1]}, gridUnits: true})
                    .scaleToObject(0.65, {gridUnits: true})
                    .scaleIn(0, 500, {ease: 'easeOutBack'})
                    .scaleOut(0, 500, {ease: 'easeOutCubic'})
                    .duration(2000)
                    .zIndex(1)
                .effect()
                    .delay(10 + 100 * u)
                    .file('animated-spell-effects-cartoon.energy.pulse.yellow')
                    .attachTo(targetOrder[u+1], {offset: {x: targetOffsetX[u+1], y: targetOffsetY[u+1]}, gridUnits: true})
                    .scaleToObject(0.6, {gridUnits: true})
                    .filter('ColorMatrix', {saturate: -1})
                    .zIndex(1)
                .effect()
                    .delay(10 + 100 * u)
                    .file('jb2a.healing_generic.03.burst.bluepurple')
                    .attachTo(targetOrder[u+1])
                    .scaleToObject(2.2, {considerTokenScale: true})
                    .fadeIn(500)
                    .fadeOut(1000)
                    .opacity(1)
                    .belowTokens()
                    .startTime(1000)
                    .filter('ColorMatrix', {saturate:-0.5, hue: -50})
                    .zIndex(1)
                .play();
        }
    }
    /* eslint-enable indent */
}
export let eyesOfNight = {
    name: 'Eyes of Night',
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