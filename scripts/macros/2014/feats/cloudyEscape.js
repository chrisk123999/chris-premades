import {Teleport} from '../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    await Teleport.target(workflow.token, workflow.token, {
        animation: playAnimation ? 'mistyStep' : 'none',
        range: 30
    });
}
export let cloudyEscape = {
    name: 'Guile of the Cloud Giant: Cloudy Escape',
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