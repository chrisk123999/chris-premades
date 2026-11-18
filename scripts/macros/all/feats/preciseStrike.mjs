import {activityUtils, automationUtils, constants, DamageBonus, dialogUtils, documentUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function attack({document: item, workflow}) {
    if (workflow.targets.count !== 1 || !workflow.token) return;
    if (!workflow.targets.documents[0].actor) return;
    const attackType = automationUtils.getConfigValue(item, 'attackType');
    if (attackType && !workflowUtils.isAttackType(workflow, attackType)) return;
    const combatData = tokenUtils.getCombatData(workflow.token.document);
    const activity = itemUtils.getActivityByIdentifier(item, 'precise-strike');
    if (!activity || !activityUtils.checkCosts(activity) || (activity.uses.max && !activity.uses.value)) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    workflow.tracker.advantage.add('precise-strike', item.name);
    workflowUtils.setWorkflowProperty(workflow, 'preciseStrike', true);
    if (activity.uses.max && combatData.inCombat) await documentUtils.update(activity, {'uses.spent': activity.uses.spent + 1});
}
async function damage({document: item, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'preciseStrike') || !workflow.hitTargets.count) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'precise-strike');
    if (!activity) return Logging.addMacroWarning('CPR', 'precise-strike', 'Missing the precise-strike activity.', {notify: 'warn'});
    const formula = automationUtils.getConfigValue(item, 'formula');
    const type = workflow.damageRolls[0]?.options.type ?? workflow.defaultDamageType;
    return new DamageBonus(item, {formula, optional: false, type, maxTargets: 1})
        .withOnUse(() => workflowUtils.completeActivityUse(activity, [], {fast: true}));
}
export const preciseStrike = {
    name: 'Precise Strike',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 50
        },
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        }
    ],
    config: {
        formula: {
            default: '1d8',
            type: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        attackType: {
            default: 'weaponAttack',
            type: 'select',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            category: 'homebrew',
            get options() { return constants.attackTypeOptions; }
        }
    }
};
