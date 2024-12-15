import {activityUtils, genericUtils, itemUtils} from '../../utils.js';
async function use ({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let validTargets = workflow.targets.filter(i => i.actor.system.attributes.hp.value < i.actor.system.attributes.hp.max);
    if (!validTargets.size) return;
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let newActivity = activityUtils.duplicateActivity(workflow.activity);
    await activityUtils.setDamage(newActivity, formula + '[' + newActivity.damage.parts[0].types.first() + ']');
    workflow.activity = newActivity;
}
export let tollTheDead = {
    name: 'Toll the Dead',
    version: '1.1.0',
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