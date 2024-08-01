import {itemUtils} from '../../utils.js';
async function use ({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let validTargets = workflow.targets.filter(i => i.actor.system.attributes.hp.value < i.actor.system.attributes.hp.max);
    if (!validTargets.size) return;
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    workflow.item = workflow.item.clone({'system.damage.parts': [[formula + '[' + workflow.item.system.damage.parts[0][1] + ']', workflow.item.system.damage.parts[0][1]]]}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
export let tollTheDead = {
    name: 'Toll the Dead',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: 'd12',
            homebrew: true,
            category: 'homebrew'
        }
    ]
};