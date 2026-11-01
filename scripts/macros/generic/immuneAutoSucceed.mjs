import {activityUtils, actorUtils, Logging, workflowUtils} from '../../proxy.mjs';
function checkImmunities({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.targets.size) return;
    if (!['check', 'save'].includes(workflow.activity.type))
        return Logging.addMacroWarning(source, identifier, `${identifier} is attached to an activity with no check or save! (activity) ${activity.uuid}`);
    const conditions = activityUtils.getConditions(workflow.activity);
    if (!conditions.size)
        return Logging.addMacroWarning(source, identifier, `${identifier} is attached to an activity that does not apply any conditions! (activity) ${activity.uuid}`);
    for (const target of workflow.targets) {
        if (!target.actor) continue;
        const immunities = conditions.filter(c => actorUtils.checkTrait(target.actor, 'ci', c));
        if (!immunities.size) continue;
        const matched = new Set();
        for (const effect of actorUtils.getEffects(target.actor)) {
            if (!effect.active) continue;
            const changes = effect.system.changes?.filter(c => c.type === 'add' && c.key === 'system.traits.ci.value' && immunities.has(c.value));
            for (const change of changes) {
                workflowUtils.grantRollModifier(workflow, 'succeed', target.id, 'condition-immunity-' + change.value, effect.name);
                matched.add(change.value);
            }
        }
        for (const c of immunities) {
            if (matched.has(c)) continue;
            const display = _loc('CAT.DAE.CI.Name', {condition: CONFIG.DND5E.conditionTypes[c]?.name ?? c.capitalize()});
            workflowUtils.grantRollModifier(workflow, 'succeed', target.id, 'condition-immunity-' + c, display);
        }
    }
}
/**
 * Targets succeed on checks or saves from this activity if it would apply a condition to which they are immune.
 * Bound on an activity. Fires on `activityPreambleComplete`.
 */
export const immuneAutoSucceed = {
    rules: 'all',
    version: '2.1.7',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: checkImmunities,
            priority: 55 // after generic targetCreatureTypes
        }
    ]
};
