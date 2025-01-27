import {Teleport} from '../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let animation = itemUtils.getConfig(workflow.item, 'playAnimation') ? (animationUtils.jb2aCheck() === 'patreon' ? 'vortexWarp' : 'mistyStep') : 'none';
    if (!workflow.failedSaves.size) return;
    let range = 90 + (30 * (workflow.castData.castLevel - 2));
    for (let i of workflow.failedSaves) {
        await Teleport.target([i], workflow.token, {range: range, animation: animation});
    }
}
export let vortexWarp = {
    name: 'Vortex Warp',
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