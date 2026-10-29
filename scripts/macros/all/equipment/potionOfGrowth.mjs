import {automationUtils, effectUtils} from '../../../proxy.mjs';
async function drink({workflow}) {
    const actor = (workflow.targets.first() ?? workflow.token)?.actor ?? workflow.actor;
    const effect = workflow.item.effects.find(effect => !effect.transfer);
    if (effect) await effectUtils.createItemEffect(actor, workflow.item, effect.id, {config: automationUtils.getConfigValues(workflow.item, configKeys)});
}
export const potionOfGrowth = {
    name: 'Potion of Growth',
    version: '2.1.5',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: drink,
            priority: 50
        }
    ],
    config: {
        sizeSteps: {
            default: 1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.EnlargeReduce.SizeSteps',
            category: 'homebrew'
        }
    }
};
export const potionOfDiminution = {
    ...potionOfGrowth,
    name: 'Potion of Diminution'
};
const configKeys = Object.keys(potionOfGrowth.config);
