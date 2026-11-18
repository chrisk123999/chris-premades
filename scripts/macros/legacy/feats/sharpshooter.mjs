import {automationUtils, dialogUtils, workflowUtils} from '../../../proxy.mjs';
async function attack({document: item, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'rangedWeaponAttack') || CONFIG.DND5E.weaponTypeMap[workflow.item.system.type?.value] !== 'ranged' || !workflow.item.system.prof?.multiplier) return;
    if (!workflow.activity.damage?.parts.length) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    workflowUtils.addAttackRollPart(workflow, automationUtils.getConfigValue(item, 'bonus'));
    workflowUtils.setWorkflowProperty(workflow, 'sharpshooter', true);
}
async function damage({document: item, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'sharpshooter') || !workflow.hitTargets.count) return;
    const damageType = workflow.damageRolls[0]?.options.type ?? workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, automationUtils.getConfigValue(item, 'formula'), {damageType});
}
export const sharpshooter = {
    name: 'Sharpshooter',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        },
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 50
        }
    ],
    config: {
        bonus: {
            default: '-5',
            type: 'text',
            label: 'CHRISPREMADES.Config.AttackBonus',
            category: 'homebrew'
        },
        formula: {
            default: '10',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
