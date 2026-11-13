import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function log(msg, notify) {
    Logging.addMacroWarning('chris-premades', 'cutting-words', msg, {notify});
}
async function validTarget(activity, target, rules, type, total) {
    if (actorUtils.hasUsedReaction(activity.actor)) return;
    const self = actorUtils.getFirstToken(activity.actor);
    if (!self || !target?.actor) return;
    if (rules === '2014' && target.actor.statuses.has('deafened'))
        return log(`Cutting Words exited early on a target who cannot hear. (activity) ${activity.uuid} (target) ${target.uuid}`);
    if (!automationUtils.getConfigValue(activity.item, type))
        return log(`Cutting Words is disabled for this roll type! (activity) ${activity.uuid} (roll) ${type}`);
    if (!actorUtils.getItemByIdentifier(activity.actor, 'bardic-inspiration', {type: 'feat'})?.system.uses.value)
        return log(`Cutting Words exited early without bardic inspiration uses. (activity) ${activity.uuid}`);
    if (!tokenUtils.canSee(self, target))
        return log(`Cutting Words exited early on an unseen target. (activity) ${activity.uuid} (target) ${target.uuid}`);
    const key = 'CHRISPREMADES.Macros.All.CuttingWords.' + (rules === '2024' ? 'Prompt' : 'PromptLegacy');
    const prompt = `<div style='text-align: left;'><b>${_loc(cuttingWords.config[type]?.label ?? type)}</b><p>${_loc(key, {
        total: dnd5e.utils.formatNumber(total),
        name: dialogUtils.getTokenName(target),
        item: activity.item.name
    })}</p></div>`;
    const choice = await dialogUtils.confirm(activity.item.name, prompt, {userId: queryUtils.firstOwner(activity.actor, true)});
    if (!choice) return log(`Cutting Words exited early due to a declined prompt. (activity) ${activity.uuid}`);
    if (rules === '2014' && actorUtils.checkTrait(target.actor, 'ci', 'charmed'))
        return log('CHRISPREMADES.Macros.All.CuttingWords.Immune', true);
    return true;
}
async function attack({document: activity, token, workflow}) {
    if (!workflow.targets.count) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const rules = documentUtils.getRules(activity.item);
    if (rules === '2024') {
        if (workflow.isFumble || workflow.isCritical) return;
        if (workflow.targets.documents[0].actor.system.attributes.ac.value > workflow.attackTotal)
            return log(`Cutting Words exited early on a failed roll. (activity) ${activity.uuid} (target) ${token.uuid}`);
    }
    if (!await validTarget(activity, token, rules, 'attack', workflow.attackTotal)) return;
    const result = await workflowUtils.syntheticActivityRoll(activity, [token]);
    await workflowUtils.bonusAttack(workflow, -result.utilityRoll.total);
}
async function damage({document: activity, token, workflow}) {
    if (!workflow.hitTargets.count) return;
    const types = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (Object.keys(CONFIG.DND5E.healingTypes).some(t => types.has(t))) return;
    const rules = documentUtils.getRules(activity.item);
    if (!await validTarget(activity, token, rules, 'damage', workflow.damageTotal)) return;
    const result = await workflowUtils.syntheticActivityRoll(activity, [token]);
    await workflowUtils.bonusDamage(workflow, -result.utilityRoll.total);
}
async function checkSkillTool({document: activity, checkId, skillId, toolId, roll, token}) {
    const type = checkId ? 'check' : skillId ? 'skill' : toolId ? 'tool' : '';
    const rules = documentUtils.getRules(activity.item);
    if (rules === '2024' && !roll.isSuccess)
        return log(`Cutting Words exited early on a failed roll. (activity) ${activity.uuid} (target) ${token.uuid}`);
    if (!type || !await validTarget(activity, token, rules, type, roll.total)) return;
    const result = await workflowUtils.syntheticActivityRoll(activity, [token]);
    return await rollUtils.addToRoll(roll, -result.utilityRoll.total);
}
const macro = (pass, fn) => ({
    pass, macro: fn, priority: 500,
    configDisabled: 'conditions',
    configDistance: 'range',
    dispositions: 'enemy',
    canOverlap: true
});
const toggle = label => ({
    default: true,
    type: 'checkbox',
    category: 'behavior',
    label
});
const d20 = [macro('nearbyBonus', checkSkillTool)];
export const cuttingWords = {
    name: 'Cutting Words',
    version: '2.1.7',
    rules: 'all',
    roll: [
        macro('nearbyAttackRollBonuses', attack),
        macro('nearbyDamageRollBonuses', damage)
    ],
    check: d20,
    skill: d20,
    tool: d20,
    config: {
        range: {
            default: '60',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range'
        },
        conditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CAT.MEDKIT.Effect.DisableCondition.Label',
            get options() { return constants.statusOptions; }
        },
        attack: toggle('DND5E.AttackRoll'),
        damage: toggle('DND5E.DamageRoll'),
        check: toggle('DND5E.ActionAbil'),
        skill: toggle('CAT.Skill.Title'),
        tool: toggle('DND5E.ToolCheck')
    }
};
