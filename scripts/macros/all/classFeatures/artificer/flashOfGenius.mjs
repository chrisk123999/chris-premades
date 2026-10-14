import {actorUtils, automationUtils, constants, D20Bonus, Logging, rollUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function roll({document: activity, macroClass: {identifier, source}, token: target}) {
    const log = msg => Logging.addMacroWarning(source, identifier, msg);
    if (!activity.item.system.uses.value) return log(`Flash of Genius exited early without item uses. (actor) ${activity.actor.uuid}`);
    if (actorUtils.hasUsedReaction(activity.actor)) return log(`Flash of Genius exited early due to a spent reaction. (actor) ${activity.actor.uuid}`);
    if (target.actor.uuid !== activity.actor.uuid) {
        const range = activity.range.value;
        const caster = actorUtils.getFirstToken(activity.actor);
        if (caster.disposition !== target.disposition) return;
        if (!tokenUtils.canSee(caster, target)) return log(`Flash of Genius exited early on an unseen target. (target) ${target.uuid} (caster) ${caster.uuid}`);
        if (range && tokenUtils.getDistance(caster, target) > range) return log(`Flash of Genius exited early due to its range limit. (target) ${target.uuid} (caster) ${caster.uuid}`);
    }
    const formula = (await rollUtils.rollDice(activity.roll.formula, {document: activity}))?.total;
    if (formula === undefined) return log(`Flash of Genius exited early due to a failed formula parse. (formula) ${activity.roll.formula}`);
    const phase = automationUtils.getConfigValue(activity.item, 'phase');
    const bonus = new D20Bonus(activity, {formula, phase, targetActor: target.actor})
        .withOnUse(() => workflowUtils.syntheticActivityRoll(activity, [target]))
        .withDefaultCosts();
    return target.actor.uuid !== activity.actor.uuid ? bonus.withDefaultRequest() : bonus;
}
const macro = [{pass: 'sceneOptionalBonus',  macro: roll, priority: 500}];
export const flashOfGenius = {
    name: 'Flash of Genius',
    version: '2.1.3',
    rules: 'all',
    check: macro,
    save: macro,
    skill: macro,
    tool: macro,
    config: {
        phase: {
            default: 'postResult',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Phase',
            hint: 'CHRISPREMADES.Macros.Generic.Common.PhaseHint',
            get options() { return constants.bonusPhaseOptions; }
        }
    }
};
