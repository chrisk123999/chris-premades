import {actorUtils, automationUtils, constants, DamageBonus, documentUtils, effectUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function onHit({document: effect, macroClass: {identifier, source}, workflow}) {
    if (!workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const origin = await effectUtils.getOriginActivity(effect);
    if (!origin) return Logging.addMacroWarning(source, identifier, `Path to the Grave exited early without locating its origin activity. (effect) ${effect.uuid}`);
    const selfBonus = origin.actor.uuid === workflow.actor.uuid;
    const caster = selfBonus ? workflow.tokenDocument : actorUtils.getFirstToken(origin.actor);
    if (!caster) return Logging.addMacroWarning(source, identifier, `Path to the Grave exited early without finding the caster's token. (effect) ${effect.uuid}`);
    if (!selfBonus && !tokenUtils.canSee(caster, workflow.tokenDocument))
        return Logging.addMacroWarning(source, identifier, `Path to the Grave exited early on an attacker not visible to the caster. (caster) ${caster.uuid} (attacker) ${workflow.tokenDocument.uuid}`);
    const config = automationUtils.getConfigValues(origin.item, Object.keys(pathToTheGrave.config));
    const bonus = new DamageBonus(origin, {type: config.damageType, formula: config.formula, targetActor: workflow.actor})
        .withCostHandler(() => ({effect: {[effect.uuid]: {cost: 1, available: 1}}})) // third party request auto approves if no costs
        .withScalingHints(({bonus}) => bonus.scalingHints = [
            {label: effect.name, tooltip: _loc('CHRISPREMADES.Macros.Modern.PathToTheGrave'), id: 'effect.' + effect.uuid }
        ]);
    if (!selfBonus) bonus.withDefaultRequest();
    return bonus.withOnUse(() => documentUtils.deleteDocument(effect));
}
export const pathToTheGrave = {
    name: 'Path to the Grave',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'targetOptionalBonusDamage',
            macro: onHit,
            priority: 300
        }
    ],
    config: {
        formula: {
            default: '@classes.cleric.levels',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        },
        damageType: {
            default: ['necrotic', 'radiant'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
