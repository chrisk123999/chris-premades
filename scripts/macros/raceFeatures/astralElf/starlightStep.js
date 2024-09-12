import {Teleport} from '../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    await Teleport.target(workflow.token, workflow.token, {
        animation: (itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck()) ? 'mistyStep' : 'none',
        range: 30
    });
}
export let starlightStep = {
    name: 'Starlight Step',
    version: '0.12.64',
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