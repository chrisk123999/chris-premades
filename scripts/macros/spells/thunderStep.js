import {Teleport} from '../../lib/teleport.js';
import {actorUtils, animationUtils, dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../utils.js';

async function early({workflow}) {
    let casterSize = actorUtils.getSize(workflow.actor);
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'ally', {includeIncapacitated: true}).filter(i => actorUtils.getSize(i.actor) <= casterSize);
    let toTeleport = [workflow.token];
    if (nearbyTargets.length) {
        let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.macros.thunderStep.select', nearbyTargets, {skipDeadAndUnconscious: false});
        if (selection && selection.length) {
            toTeleport.push(...selection[0]);
        }
    }
    genericUtils.updateTargets(workflow.targets.filter(i => !toTeleport.includes(i)));
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    await Teleport.group(toTeleport, workflow.token, {range: 90, animation: playAnimation ? 'thunderStep' : 'none'});
}
export let thunderStep = {
    name: 'Thunder Step',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};