import {combatUtils, constants, dialogUtils, effectUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.inCombat()) return;
    if (game.combat.round !== 1) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'surpriseAttack');
    if (config.showDialog) {
        let selection = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.SurpriseAttack.Surprised');
        if (!selection) return;
    } else {
        if (!effectUtils.getEffectByStatusID(workflow.hitTargets.first().actor, 'surprised')) return;
    }
    let damageFormula = config.formula;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, damageFormula, {damageType});
    await workflowUtils.completeItemUse(item);
}
export let surpriseAttack = {
    name: 'Surprise Attack',
    translation: 'CHRISPREMADES.Macros.SurpriseAttack.Name',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 215
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d6'
        },
        {
            value: 'showDialog',
            label: 'CHRISPREMADES.Macros.SurpriseAttack.Dialog',
            type: 'checkbox',
            default: true
        }
    ]
};