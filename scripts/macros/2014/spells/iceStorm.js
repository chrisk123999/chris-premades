import {animationUtils, itemUtils} from '../../../utils.js';

async function early({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || animationUtils.jb2aCheck() !== 'patreon' || !workflow.template) return;
    let template = workflow.template;
    //Animations by: eskiemoh
    await new Sequence()
        .effect()
        .file('jb2a.magic_signs.circle.02.evocation.loop.blue')
        .atLocation(template)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .fadeIn(750)
        .fadeOut(1000)
        .size(9, {'gridUnits': true})
        .duration(11000)
        .belowTokens()
        .zIndex(0.1)

        .effect()
        .file('jb2a.magic_signs.circle.02.evocation.loop.blue')
        .atLocation(template)
        .scaleIn(0, 500, {'ease': 'easeOutCubic'})
        .fadeIn(150, {'delay': 500})
        .size(9, {'gridUnits': true})
        .duration(1000)
        .fadeOut(250)
        .belowTokens()
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 2})
        .filter('Blur', {'blurX': 5, 'blurY': 10})
        .zIndex(0.11)

        .effect()
        .file('jb2a.extras.tmfx.border.circle.outpulse.01.fast')
        .scaleIn(0, 500, {'ease': 'easeOutQuint'})
        .delay(400)
        .fadeOut(1000)
        .atLocation(template)
        .duration(1000)
        .size(12, {'gridUnits': true})
        .zIndex(1)

        .wait(1000)

        .play();
    new Sequence()
        .effect()
        .file('jb2a.sleet_storm.blue')
        .atLocation(template)
        .size(9.5, {'gridUnits': true})
        .persist()
        .attachTo(template)
        .fadeIn(6000)
        .fadeOut(1000)
        .delay(500)
        .belowTokens()

        .effect()
        .file('jb2a.smoke.ring.01.white')
        .atLocation(template)
        .size(12, {'gridUnits': true})
        .fadeIn(4000)
        .opacity(0.2)
        .duration(6000)
        .playbackRate(0.75)
        .fadeOut(1000)
        .delay(500)
        .zIndex(1)

        .effect()
        .file('jb2a.magic_signs.circle.02.evocation.loop.blue')
        .atLocation(template)
        .fadeIn(6000)
        .fadeOut(1000)
        .delay(500)
        .size(9, {'gridUnits': true})
        .filter('ColorMatrix', {'saturate': -1, 'brightness': 0})
        .opacity(0.2)
        .persist()
        .attachTo(template)
        .belowTokens()
        .zIndex(0.1)

        .play();
    for (let e = 0; e < 44; e++) {
        let offsetX = (Math.random() * (3.5 + 3.5) - 3.5) * canvas.grid.size;
        let offsetY = (Math.random() * (3.5 + 3.5) - 3.5) * canvas.grid.size;
        new Sequence()
            .wait(150 * e + 1)

            .effect()
            .file('jb2a.spell_projectile.ice_shard')
            .scale(1)
            .atLocation({'x':template.x + offsetX, 'y': template.y + offsetY}, {'offset': {'y': -7}, 'gridUnits': true})
            .stretchTo({'x':template.x + offsetX, 'y': template.y + offsetY},{ 'offset': {'y':0}, 'gridUnits': true})
            .zIndex(6)

            .play();
    }
    Array.from(workflow.targets).forEach(target => {
        new Sequence()
            .wait(1150)

            .effect()
            .from(target)
            .atLocation(target)
            .loopProperty('sprite', 'position.x', {'from': -0.025, 'to': 0.025, 'duration': 75, 'pingPong': true, 'gridUnits': true})
            .fadeIn(100)
            .fadeOut(400)
            .duration(500)
            .scaleToObject(target.document.scale)
            .opacity(0.5)
            .repeats(22,300,300)

            .effect()
            .file('jb2a.impact.008.blue')
            .atLocation(target, {'randomOffset': 1})
            .randomRotation()
            .scaleToObject(2)
            .filter('ColorMatrix', {'saturate': -0.75, 'brightness': 1.5})
            .repeats(22,300,300)

            .play();
    });
}

export let iceStorm = {
    name: 'Ice Storm',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
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