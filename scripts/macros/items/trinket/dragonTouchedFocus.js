import {Teleport} from '../../../lib/teleport.js';
import {itemUtils} from '../../../utils.js';

async function lateGem({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (['innate', 'atwill'].includes(workflow.item.preparation?.mode)) return;
    if (!workflow.item.system.level) return;
    await Teleport.target(workflow.token, workflow.token, {
        animation: itemUtils.getConfig(item, 'playAnimation') ? 'mistyStep' : 'none',
        range: 15
    });
}
export let dragonTouchedFocusSlumbering = {
    name: 'Dragon-Touched Focus (Slumbering)',
    version: '0.12.70'
};
export let dragonTouchedFocusStirringChromatic = {
    name: 'Dragon-Touched Focus (Stirring / Chromatic)',
    version: '0.12.70'
};
export let dragonTouchedFocusStirringGem = {
    name: 'Dragon-Touched Focus (Stirring / Gem)',
    version: '0.12.70',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateGem,
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
};