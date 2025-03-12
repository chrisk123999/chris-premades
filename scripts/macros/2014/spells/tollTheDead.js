import {activityUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let validTargets = workflow.targets.filter(i => i.actor.system.attributes.hp.value < i.actor.system.attributes.hp.max);
    if (!validTargets.size) return;
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let activityData = activityUtils.withChangedDamage(workflow.activity, formula);
    workflow.item = workflow.item.clone({
        ['system.activities.' + workflow.activity.id]: activityData
    }, {keepId: true});
    workflow.item.prepareData();
    workflow.item.applyActiveEffects();
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let tollTheDead = {
    name: 'Toll the Dead',
    version: '1.1.10',
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