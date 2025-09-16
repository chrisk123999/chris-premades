import {psionicEnergy} from '../../../../../legacyMacros.js';
import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let animation = 'none';
    if (itemUtils.getConfig(workflow.item, 'playAnimation')) {
        animation = (animationUtils.jb2aCheck() === 'patreon') ? 'shadowStep' : 'mistyStep';
    }
    await Teleport.target(workflow.token, workflow.token, {
        animation,
        range: workflow.utilityRolls[0].total
    });
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['psychicTeleportation'], 'psionicPower');
    await itemUtils.fixScales(item);
}
export let soulBlades = {
    name: 'Soul Blades',
    version: '1.3.58',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['psychicTeleportation']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
    scales: psionicEnergy.scales,
    config: [
        ...psionicEnergy.config,
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};