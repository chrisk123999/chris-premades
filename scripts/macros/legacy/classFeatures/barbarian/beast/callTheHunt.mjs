import {automationUtils, combatUtils, DamageBonus, dataUtils, dialogUtils, documentUtils, genericUtils, itemUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function callHunt({data, document: activity, macroClass: {identifier, source}}) {
    if (!activity.item.system.uses.value) return Logging.addMacroWarning(source, identifier, `Call of the Hunt exited early without item uses. (item) ${activity.item.uuid}`);
    const effectData = activity.item.effects.contents[0]?.toObject();
    if (!effectData) return Logging.addMacroWarning(source, identifier, `Call of the Hunt exited early due to a missing active effect. (activity) ${activity.uuid}`);
    const tempHP = itemUtils.getActivityByIdentifier(activity.item, 'hunt-temphp');
    if (!tempHP) return Logging.addMacroWarning(source, identifier, `Call of the Hunt exited early without locating its temp hp activity. (item) ${activity.item.uuid} (identifier) hunt-temphp`);
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    const targetRoll = await workflowUtils.syntheticActivityRoll(activity);
    dataUtils.setOrigin(effectData, activity);
    genericUtils.setProperty(effectData, 'flags.dnd5e.dependentOn', data.effect.uuid);
    genericUtils.setProperty(effectData, `flags.${source}.callHunt.formula`, automationUtils.getConfigValue(activity.item, 'bonus'));
    const updates = Array.from(targetRoll.targets).map(t => t.actor ? {
        documentName: 'ActiveEffect',
        data: [effectData],
        action: 'create',
        parent: t.actor
    } : undefined).filter(Boolean);
    if (!updates.length) return Logging.addMacroWarning(source, identifier, `Call of the Hunt exited early with no valid targets. (activity) ${activity.uuid}`);
    await workflowUtils.syntheticActivityRoll(tempHP, [], {config: {scaling: updates.length - 1}});
    await documentUtils.modifyBatch(updates);
}
async function targets({document: activity, workflow}) {
    const maxTargets = automationUtils.getConfigValue(activity.item, 'targets');
    const maxAmount = (await rollUtils.rollDice(maxTargets, {document: activity}))?.total ?? 1;
    if (workflow.targets.size <= maxAmount) return;
    const oldTargets = Array.from(workflow.targets).map(t => t.document).filter(t => tokenUtils.canSee(workflow.token.document, t));
    const preselected = oldTargets.reduce((obj, t) => 
        (obj[t.id] = workflow.token.document.disposition * t.disposition >= 0 && obj.count++ < maxAmount, obj),
    {count: 0});
    const choice = await dialogUtils.selectTargetDialog(
        activity.item.name,
        _loc('CHRISPREMADES.Generic.SelectTargets', {maxAmount}),
        oldTargets,
        {type: 'multiple', skipDeadAndUnconscious: false, maxAmount, preselected}
    );
    if (!choice) return true;
    await workflowUtils.updateTargets(workflow, choice?.result?.length ? choice.result : oldTargets.slice(0, maxAmount));
}
async function huntDamage({document: effect, macroClass: {identifier, source}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const combat = tokenUtils.getCombatData(workflow.token.document);
    if (combatUtils.isStampedThisTurn(effect.flags[source]?.callHunt?.stamps, workflow.token.id, combat))
        return Logging.addMacroWarning(source, identifier, `Call of the Hunt exited early. Already used this turn. (token) ${workflow.token.document.uuid}`);
    const formula = effect.flags[source]?.callHunt?.formula;
    if (!formula) return Logging.addMacroWarning(source, identifier, `Call of the Hunt exited early with a missing damage bonus formula. (effect) ${effect.uuid}`);
    return new DamageBonus(effect, {actor: effect.parent, formula})
        .withScalingHints(({bonus}) => {
            const label = _loc('CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.OncePerTurn');
            bonus.scalingHints = [{label, id: label}];
        })
        .withOnUse(async ({bonus, workflow}) => {
            const stamps = bonus.document.flags[source]?.callHunt?.stamps ?? [];
            const combat = tokenUtils.getCombatData(workflow.token.document);
            await documentUtils.setFlag(bonus.document, source, 'callHunt.stamps', combatUtils.addTurnStamp(stamps, workflow.token.id, combat));
        });
}
export const callTheHunt = {
    name: 'Call the Hunt',
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorRageBegin',
            macro: callHunt,
            priority: 260
        }
    ],
    roll: [
        {
            pass: 'activityTargeting',
            macro: targets,
            priority: 50
        }
    ],
    config: {
        bonus: {
            default: '1d6',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageBonus'
        },
        targets: {
            default: 'max(1, @abilities.con.mod)',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets'
        }
    }
};
export const callTheHuntDamage = {
    version: callTheHunt.version,
    rules: callTheHunt.rules,
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: huntDamage,
            priority: 200
        }
    ]
};
