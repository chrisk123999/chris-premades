import {activityUtils, actorUtils, automationUtils, constants, D20Bonus, documentUtils, Logging, tokenUtils} from '../../../../../proxy.mjs';
async function attackBonus({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflow.actor.uuid === activity.actor.uuid) return;
    if (actorUtils.hasUsedReaction(activity.actor)) return;
    if (!activityUtils.checkCosts(activity))
        return Logging.addMacroWarning(source, identifier, `Guided Strike exited early without channel divinity uses. (activity) ${activity.uuid}`);
    if (!workflow.token)
        return Logging.addMacroWarning(source, identifier, `Guided Strike exited early without a placed attacker token. (activity) ${activity.uuid} (rolling actor) ${workflow.actor.uuid}`);
    const caster = actorUtils.getFirstToken(activity.actor);
    if (!caster)
        return Logging.addMacroWarning(source, identifier, `Guided Strike exited early without a placed caster token. (activity) ${activity.uuid}`);
    if (tokenUtils.isEnemy(workflow.token.document, caster)) return;
    const range = activityUtils.getRange(activity);
    if (range && !tokenUtils.isWithinDistance(caster, workflow.token.document, range))
        return Logging.addMacroWarning(source, identifier, `Guided Strike exited early on a target out of range. (target) ${workflow.token.document.uuid} (caster) ${caster.uuid}`);
    const phase = automationUtils.getConfigValue(activity.item, 'phase');
    const formula = automationUtils.getConfigValue(activity.item, 'formula');
    return new D20Bonus(activity, {formula, phase, targetActor: workflow.actor})
        .withDefaultRequest()
        .withDefaultCosts()
        .withDefaultOnUse();
}
export const warGodsBlessing = {
    name: 'War God\'s Blessing',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'sceneOptionalBonusAttack',
            macro: attackBonus,
            priority: 600
        }
    ],
    config: {
        formula: {
            default: '10',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AttackBonus'
        },
        phase: {
            default: 'preResult',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Phase.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.Phase.Hint',
            get options() { return constants.bonusPhaseOptions; }
        }
    }
};
