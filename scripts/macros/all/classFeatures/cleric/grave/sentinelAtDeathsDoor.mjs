import {activityUtils, actorUtils, dialogUtils, documentUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function onHit({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const rules = documentUtils.getRules(activity.item);
    if (rules === '2014' && !workflow.isCritical) return;
    if (actorUtils.hasUsedReaction(activity.actor))
        return Logging.addMacroWarning(source, identifier, `Sentinel at Death's Door exited early with an already spent reaction. (activity) ${activity.uuid}`);
    if (!activityUtils.checkCosts(activity))
        return Logging.addMacroWarning(source, identifier, `Sentinel at Death's Door exited early with no item uses. (activity) ${activity.uuid}`);
    const self = actorUtils.getFirstToken(activity.actor);
    if (!self)
        return Logging.addMacroWarning(source, identifier, `Sentinel at Death's Door exited early without locating the caster's token. (activity) ${activity.uuid}`);
    const range = activityUtils.getRange(activity);
    const targets = workflow.hitTargets.documents.filter(t =>
        t.actor?.uuid === activity.actor.uuid || (
            (rules !== '2024' || actorUtils.isBloodied(t.actor)) &&
            !tokenUtils.isEnemy(self, t) &&
            tokenUtils.isWithinDistance(self, t, range) &&
            tokenUtils.canSee(self, t)
        )
    );
    if (!targets.length)
        return Logging.addMacroWarning(source, identifier, `Sentinel at Death's Door exited early with no visible${rules === '2024' ? ' and bloodied' : ' '} allies within range. (caster token) ${self.uuid}`);
    if (!await dialogUtils.confirmUseItem(activity.item, {userId: queryUtils.firstOwner(activity.actor, true)})) return;
    if (workflow.isCritical) {
        workflow.tracker.critical.suppress(identifier, activity.item.name);
        const entries = [];
        for (const [type, sources] of Object.entries(workflow.attackAttribution)) {
            if (!sources) continue;
            for (const [source, displayName] of Object.entries(sources)) {
                entries.push({type, source, displayName});
            }
        }
        workflow.attackRoll.options.attributions = entries;
        await workflow.setAttackRoll(workflow.attackRoll);
        await workflow.displayAttackRoll();
    }
    await workflowUtils.syntheticActivityRoll(activity, targets);
    if (rules !== '2024') return;
    workflowUtils.setWorkflowProperty(workflow, 'sentinelAtDeathsDoor', targets.map(t => t.uuid));
}
async function halveDamage({ditem, workflow}) {
    const targets = workflowUtils.getWorkflowProperty(workflow, 'sentinelAtDeathsDoor');
    if (!targets?.includes(ditem.targetUuid)) return;
    workflowUtils.setDamageItemDamage(ditem, Math.floor(ditem.totalDamage * 0.5));
}
export const sentinelAtDeathsDoor = {
    name: 'Sentinel at Death\'s Door',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'sceneAttackRollComplete',
            macro: onHit,
            priority: 600,
            canOverlap: true
        },
        {
            pass: 'sceneDamagePercentReductions',
            macro: halveDamage,
            priority: 600
        }
    ]
};
