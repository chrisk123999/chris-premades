import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let animation = 'none';
    if (itemUtils.getConfig(workflow.item, 'playAnimation')) {
        animation = (animationUtils.jb2aCheck() === 'patreon') ? 'shadowStep' : 'mistyStep';
    }
    await Teleport.target(workflow.token, workflow.token, {
        animation,
        range: itemUtils.getConfig(workflow.item, 'range')
    });
}
export let shadowStep = {
    name: 'Shadow Step',
    version: '1.1.0',
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
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 60,
            category: 'homebrew'
        }
    ]
};