import {animationUtils, genericUtils, itemUtils} from '../../../utils.js';

async function early({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let template = await fromUuid(workflow.templateUuid);
    if (playAnimation && animationUtils.jb2aCheck()) {
        await new Sequence()
            .effect()
            .file('jb2a.cone_of_cold.blue')
            .attachTo(template, {offset: {x: 1.5}, local: true, gridUnits: true})
            .scaleToObject(1)
            .scale({x: 1.25, y: 1.5})
            .playbackRate(0.7)
            .belowTokens()
            .waitUntilFinished(-5000)
            .play();
        for (let i of workflow.targets) {
            new Sequence()
                .effect()
                .file('jb2a.markers.snowflake.blue.01')
                .atLocation(i)
                .scaleToObject(1.5)
                .delay(150)
                .fadeIn(500)
                .fadeOut(500)
                .playbackRate(2)
                .play();
        }
    }
}
async function late({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    await genericUtils.sleep(2000);
    if (!playAnimation || !animationUtils.jb2aCheck()) return;
    for (let i of workflow.failedSaves) {
        new Sequence()
            .effect()
            .file('jb2a.impact_themed.ice_shard.blue')
            .atLocation(i)
            .scaleToObject(1.5)
            .delay(200)
            .playbackRate(0.75)
            .play();
    }
    for (let i of workflow.saves) {
        new Sequence()
            .effect()
            .file('jb2a.energy_field.02.above.blue')
            .duration(3000)
            .startTime(1200)
            .atLocation(i)
            .scaleToObject(1)
            .playbackRate(2)
            .play();
    }
}
export let frostFingers = {
    name: 'Frost Fingers',
    version: '1.1.10',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
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