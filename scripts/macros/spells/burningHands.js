import {animationUtils, itemUtils} from '../../utils.js';

async function use ({workflow}) {
    // Animations by: eskiemoh
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    if (!playAnimation || animationUtils.jb2aCheck() !== 'patreon') return;
    let sourceToken = workflow.token;
    let template = (await fromUuid(workflow.templateUuid))?.object;
    if (!sourceToken || !template) return;
    new Sequence()
        .effect()
        .file('jb2a.energy_strands.in.yellow.01.0')
        .atLocation(sourceToken) 
        .anchor({'x':0.15})
        .scaleToObject(1.1) 
        .rotateTowards(template, {'cacheLocation': true})
        .zIndex(1)

        .effect()
        .file('jb2a.magic_signs.circle.02.evocation.loop.yellow')
        .atLocation(sourceToken)
        .fadeIn(500)
        .fadeOut(500)
        .anchor({x:0.15})
        .scaleToObject(1.1)
        .duration(5000)
        .rotateTowards(template, {'cacheLocation': true})
        .loopProperty('sprite', 'rotation', {'from': 0, 'to': 360, 'duration': 1000})
        .scaleOut(0.1, 2000, {'ease': 'easeOutQuint', 'delay': -3000})
        .zIndex(2)

        .effect()
        .file('jb2a.particles.outward.orange.01.04')
        .atLocation(sourceToken)
        .fadeIn(500)
        .fadeOut(500)
        .anchor({x:0.15})
        .scaleToObject(1.1)
        .duration(5000)
        .rotateTowards(template, {'cacheLocation': true})
        .loopProperty('sprite', 'rotation', {'from': 0, 'to': 360, 'duration': 3000})
        .scaleOut(0.175, 5000, {'ease': 'easeOutQuint', 'delay': -3000})
        .waitUntilFinished(-4000)
        .zIndex(1)

        .effect()
        .file('jb2a.impact.010.orange')
        .atLocation(sourceToken) 
        .anchor({x:0.15})
        .scaleToObject(1.1) 
        .rotateTowards(template, {'cacheLocation': true})
        .zIndex(3)

        .effect()
        .file('jb2a.burning_hands.02.orange')
        .atLocation(template.position, {'cacheLocation': true})
        .stretchTo(template, {'cacheLocation': true})
        .zIndex(3)
        .play();
}

export let burningHands = {
    name: 'Burning Hands',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};