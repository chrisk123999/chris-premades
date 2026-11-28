import {automationUtils, combatUtils, constants, D20Bonus, DamageBonus, dialogUtils, documentUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function getActivity(item, identifier) {
    const activity = itemUtils.getActivityByIdentifier(item, identifier);
    if (!activity) Logging.addMacroWarning('chris-premades', 'cruel', 'Missing the ' + identifier + ' activity.', {notify: 'warn'});
    return activity;
}
function canUse(item, token) {
    if (!item.system.uses.value) return false;
    if (!token) return true;
    const combatData = tokenUtils.getCombatData(token);
    return !combatUtils.isStampedThisTurn(item.flags['chris-premades']?.cruel?.stamps, token.id, combatData);
}
async function spend(item, activity, token, targets = []) {
    if (token) {
        const combatData = tokenUtils.getCombatData(token);
        if (combatData.inCombat) await documentUtils.setFlag(item, 'chris-premades', 'cruel.stamps', combatUtils.addTurnStamp(item.flags['chris-premades']?.cruel?.stamps ?? [], token.id, combatData));
    }
    await workflowUtils.completeActivityUse(activity, targets);
}
function damage({document: item, workflow}) {
    if (!workflow.hitTargets.count || !workflow.activity.hasDamage || !canUse(item, workflow.token?.document)) return;
    const type = workflow.damageRolls?.find(roll => roll.options.type && !['healing', 'temphp'].includes(roll.options.type))?.options.type;
    if (!type) return;
    const activity = getActivity(item, 'cruel-damage');
    if (!activity) return;
    const {formula, canCrit} = automationUtils.getConfigValues(item, ['formula', 'canCrit']);
    const bonus = new DamageBonus(item, {formula, type, maxTargets: 1, allowCritical: canCrit})
        .withOnUse(async ({bonus}) => await spend(item, activity, workflow.token?.document, (bonus.targets.size ? Array.from(bonus.targets) : workflow.hitTargets.documents).slice(0, 1)));
    bonus.targets = workflow.hitTargets.documents;
    return bonus;
}
async function critical({document: item, workflow}) {
    if (!workflow.isCritical || !workflowUtils.isAttackType(workflow, 'attack') || !canUse(item, workflow.token?.document)) return;
    const activity = getActivity(item, 'cruel-critical');
    if (!activity) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await spend(item, activity, workflow.token?.document, workflow.token ? [workflow.token.document] : []);
}
function intimidation({document: item, config, token}) {
    if (config.skill !== 'itm' || !canUse(item, token)) return;
    const activity = getActivity(item, 'cruel-intimidation');
    if (!activity) return;
    const formula = automationUtils.getConfigValue(item, 'formula');
    return new D20Bonus(item, {formula, phase: constants.bonusPhases.preResult})
        .withOnUse(async () => await spend(item, activity, token));
}
export const cruel = {
    name: 'Cruel',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        },
        {
            pass: 'actorRollFinished',
            macro: critical,
            priority: 250
        }
    ],
    skill: [
        {
            pass: 'actorOptionalBonus',
            macro: intimidation,
            priority: 250
        }
    ],
    config: {
        formula: {
            default: '1d6',
            type: 'text',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Formula'
        },
        canCrit: {
            default: false,
            type: 'checkbox',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.CanCrit'
        }
    }
};
