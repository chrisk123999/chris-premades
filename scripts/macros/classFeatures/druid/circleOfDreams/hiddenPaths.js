import {Teleport} from '../../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let targetToken = workflow.targets.first() ?? workflow.token;
    let maxRange = targetToken.actor === workflow.actor ? 60 : 30;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    await Teleport.target(targetToken, workflow.token, {
        animation: playAnimation ? 'hiddenPaths' : 'none',
        range: maxRange
    });
}
export let hiddenPaths = {
    name: 'Hidden Paths',
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