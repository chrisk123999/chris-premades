import {Teleport} from '../../../lib/teleport.js';
import {dialogUtils, itemUtils, tokenUtils} from '../../../utils.js';
async function use({workflow}) {
    let animation = itemUtils.getConfig(workflow.item, 'playAnimation') ? 'mistyStep' : 'none';
    let mistyWanderer = itemUtils.getItemByIdentifier(workflow.actor, 'mistyWanderer');
    let secondaryTarget;
    if (mistyWanderer) {
        let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'ally').filter((t) => tokenUtils.canSee(workflow.token, t));
        if (nearbyTargets?.length) {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.MistyWanderer.TeleportFriend', nearbyTargets);
            if (selection) secondaryTarget = selection[0];
        }
    }
    await Teleport.target([workflow.token], workflow.token, {range: itemUtils.getConfig(workflow.item, 'range'), animation: animation});
    if (!secondaryTarget) return;
    await Teleport.target([secondaryTarget], workflow.token, {range: 5, animation: animation});
}
export let mistyStep = {
    name: 'Misty Step',
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
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 30,
            category: 'homebrew'
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Macros.MistyWanderer.TeleportFriend',
            type: 'number',
            default: 5,
            category: 'homebrew'
        }
    ]
};