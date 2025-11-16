import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, crosshairUtils, itemUtils} from '../../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    let targetToken = workflow.targets.first();
    let position = await crosshairUtils.aimCrosshair({
        token: workflow.token, 
        maxRange: genericUtils.convertDistance(5), 
        centerpoint: targetToken.center, 
        drawBoundries: true, 
        trackDistance: true, 
        fudgeDistance: targetToken.document.width * canvas.dimensions.distance / 2,
        crosshairsConfig: {
            size: canvas.grid.distance * workflow.token.document.width / 2,
            icon: workflow.token.document.texture.src,
            resolution: (workflow.token.document.width % 2) ? 1 : -1
        }
    });
    if (position.cancelled) return;
    let teleport = new Teleport([workflow.token], workflow.token, {animation: playAnimation ? 'mistyStep' : 'none'});
    teleport.template = position;
    await teleport._move();
}
export let relentlessHex = {
    name: 'Eldritch Invocations: Relentless Hex',
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