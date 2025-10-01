import {Teleport} from '../../../../../lib/teleport.js';
import {dialogUtils, itemUtils, tokenUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let animation = itemUtils.getConfig(workflow.item, 'playAnimation') ? 'mistyStep' : 'none';
    let lunarForm = itemUtils.getItemByIdentifier(workflow.actor, 'lunarForm');
    let otherToTeleport;
    if (lunarForm) {
        let nearbyTargets = tokenUtils.findNearby(workflow.token, 10, 'ally');
        if (nearbyTargets?.length) {
            let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.MoonlightStep.TeleportFriend', nearbyTargets);
            if (selection) otherToTeleport = selection[0];
        }
    }
    await Teleport.target(workflow.token, workflow.token, {range: 30, animation});
    if (!otherToTeleport) return;
    await Teleport.target(otherToTeleport, workflow.token, {range: 10, animation});
}
export let moonlightStep = {
    name: 'Moonlight Step',
    version: '1.3.83',
    rules: 'modern',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['moonlightStep']
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