import {itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({workflow}) {
    if (workflow.disadvantage || !workflow.advantage) return;
    let {bonusFormula, activities} = itemUtils.getGenericFeatureConfig(workflow.item, 'advantageDamageBonus');
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    if (!bonusFormula.length) return;
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType: workflow.defaultDamageType});
}
export let advantageDamageBonus = {
    name: 'Advantage Damage Bonus',
    translation: 'CHRISPREMADES.Macros.AdvantageDamageBonus.Name',
    version: '0.12.78',
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
            value: 'bonus',
            label: 'CHRISPREMADES.Macros.AdvantageDamageBonus.Bonus',
            type: 'text',
            default: '2d6'
        }
    ]
};