import {Teleport} from '../../../../../lib/teleport.js';
import {animationUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let animation = 'crimsonMist';
    if (animationUtils.jb2aCheck() === 'free') animation = 'mistyStep';
    if (!itemUtils.getConfig(workflow.item, 'playAnimation')) animation = 'none';
    await Teleport.target([workflow.token], workflow.token, {range: 60, animation});
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'balefulInterdict');
}
export let interdictBoonFlashOfBrimstone = {
    name: 'Interdict Boons: Flash of Brimstone',
    version: '1.3.71',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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