import {automationUtils, combatUtils, constants, documentUtils, genericUtils, tokenUtils, workflowUtils, DamageBonus} from '../../../../../proxy.mjs';
function damage({document, workflow, token}) {
    if (workflow.item.type !== 'spell' || !workflow.hitTargets.size) return;
    const combatData = tokenUtils.getCombatData(token);
    const stamps = genericUtils.getProperty(document, 'flags.cat.radiantSoul.stamps') ?? [];
    if (combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
    const allowed = automationUtils.getConfigValue(document, 'damageTypes');
    const rolled = workflowUtils.getDamageTypes(workflow.damageRolls);
    const types = allowed.filter(type => rolled.has(type));
    if (!types.length) return;
    const ability = automationUtils.getConfigValue(document, 'ability');
    const mod = workflow.actor.system.abilities[ability]?.mod;
    if (!mod) return;
    return new DamageBonus(document, {formula: String(mod), type: types, maxTargets: 1, allowCritical: false})
        .withOnUse(async () => await documentUtils.update(document, {'flags.cat.radiantSoul.stamps': combatUtils.addTurnStamp(stamps, token.id, combatData)}));
}
export const radiantSoul = {
    name: 'Radiant Soul',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: damage, priority: 250}
    ],
    config: {
        ability: {
            default: 'cha',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew',
            get options() { return constants.abilityOptions(); }
        },
        damageTypes: {
            default: ['fire', 'radiant'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
