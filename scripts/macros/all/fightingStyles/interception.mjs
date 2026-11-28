import {activityUtils, actorUtils, automationUtils, constants, dialogUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
const warnings = {
    ally: ctx => `Interception skipped an ally with no placed token. (activity) ${ctx.activity.uuid}, (target) ${ctx.targetToken.uuid}`,
    target: ctx => `Interception skipped a target with no placed token. (activity) ${ctx.activity.uuid}, (target) ${ctx.targetToken.uuid}`,
    reaction: ctx => `Interception skipped an ally with a spent reaction. (activity) ${ctx.activity.uuid}, (target) ${ctx.targetToken.uuid}`,
    range: ctx => `Interception skipped a target out of range. (activity) ${ctx.activity.uuid}, (target) ${ctx.targetToken.uuid} (self) ${ctx.self.uuid} (range) ${ctx.range}`,
    sight: ctx => `Interception skipped an ally that could not see the attacker. (activity) ${ctx.activity.uuid}, (target) ${ctx.targetToken.uuid} (self) ${ctx.self.uuid} (attacker) ${ctx.attacker.uuid}`,
    equipped: ctx => `Interception skipped an ally without a required item equipped. (activity) ${ctx.activity.uuid}, (target) ${ctx.targetToken.uuid} (self) ${ctx.self.uuid} (items) ${ctx.equipped.join(', ')}`
};
async function intercept({document: activity, ditem, macroClass: {identifier, source}, targetToken, workflow}) {
    if (!ditem.isHit || ditem.totalDamage <= 0 || ditem.oldHP === 0) return;
    if (!tokenUtils.isEnemy(targetToken, workflow.tokenDocument)) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (targetToken.actor.uuid === activity.actor.uuid) return;
    const ctx = {activity, attacker: workflow.tokenDocument, targetToken};
    const log = msg => Logging.addMacroWarning(source, identifier, msg(ctx));
    if (actorUtils.hasUsedReaction(activity.actor)) return log(warnings.reaction);
    if (!targetToken.object) return log(warnings.target);
    ctx.self = actorUtils.getFirstToken(activity.actor);
    if (!ctx.self) return log(warnings.ally);
    ctx.equipped = automationUtils.getConfigValue(activity.item, 'equipped') ?? [];
    if (!activity.actor.items.some(i => i.system?.equipped && (!ctx.equipped.length || ctx.equipped.includes(i.system?.type?.value)))) return log(warnings.equipped);
    ctx.range = activityUtils.getRange(activity);
    if (!tokenUtils.isWithinDistance(ctx.self, targetToken, ctx.range)) return log(warnings.range);
    if (!tokenUtils.canSee(ctx.self, ctx.attacker)) return log(warnings.sight);
    const userId = queryUtils.firstOwner(activity.actor, true);
    if (!await dialogUtils.confirm(
        'COMMON.Confirm',
        _loc('CHRISPREMADES.Macros.All.Interception.Prompt', {item: activity.item.name, name: targetToken.name}),
        {userId}
    )) return;
    const result = await workflowUtils.syntheticActivityRoll(activity, [targetToken], {userId});
    workflowUtils.modifyDamageAppliedFlat(ditem, -result.utilityRoll.total);
}
export const interception = {
    name: 'Interception',
    rules: 'all',
    version: '2.1.11',
    roll: [
        {
            pass: 'sceneDamageFlatReductions',
            macro: intercept,
            canOverlap: true,
            thirdParty: true,
            priority: 600
        }
    ],
    config: {
        equipped: {
            default: ['martialM', 'martialR', 'simpleM', 'simpleR', 'shield'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.All.Interception.Equipped.Label',
            hint: 'CHRISPREMADES.Macros.All.Interception.Equipped.Hint',
            category: 'behavior',
            get options() { return [
                {label: CONFIG.DND5E.armorTypes.shield, value: 'shield'},
                ...constants.weaponTypes
            ]; }
        }
    }
};
