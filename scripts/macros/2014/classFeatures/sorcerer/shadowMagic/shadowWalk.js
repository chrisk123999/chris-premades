import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let animation = 'none';
    if (itemUtils.getConfig(workflow.item, 'playAnimation')) animation = (animationUtils.jb2aCheck() === 'patreon') ? 'shadowStep' : 'mistyStep';
    await Teleport.target(workflow.token, workflow.token, {
        animation,
        range: workflow.activity.range.value
    });
}
export let shadowWalk = {
    name: 'Shadow Walk',
    version: '1.4.19',
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