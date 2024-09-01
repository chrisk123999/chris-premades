import {Teleport} from '../../lib/teleport.js';
import {itemUtils} from '../../utils.js';
async function use({workflow}) {
    let animation = itemUtils.getConfig(workflow.item, 'playAnimation') ? 'mistyStep' : 'none';
    await Teleport.target([workflow.token], workflow.token, {range: 30, animation: animation});
}
export let mistyStep = {
    name: 'Misty Step',
    version: '0.12.47',
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
    ],
    hasAnimation: true
};