import {Teleport} from '../../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let animation = 'none';
    if (itemUtils.getConfig(workflow.item, 'playAnimation')) {
        animation = (animationUtils.jb2aCheck() === 'patreon') ? 'shadowStep' : 'mistyStep';
    }
    await Teleport.target(workflow.token, workflow.token, {
        animation,
        range: 60
    });
}
export let shadowStep = {
    name: 'Shadow Step',
    version: '0.12.49',
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