import {dialogUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'chooseDamageType');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let damageTypes = config.damageTypes;
    let selection = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!selection) return;
    await workflowUtils.replaceDamage(workflow, workflow.damageRoll.formula, {damageType: selection});
}
export let chooseDamageType = {
    name: 'Choose Damage ',
    version: '1.3.39',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'damageTypes',
            default: [],
        }
    ]
};