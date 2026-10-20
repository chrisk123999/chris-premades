import {automationUtils, combatUtils, constants, DamageBonus, documentUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function reckless({document: activity, effect, macroClass: {rules, source}}) {
    if (!activity.actor.flags[source]?.raging) return;
    if (documentUtils.getIdentifier(effect) !== automationUtils.getConfigValue(activity.item, 'reckless')) return;
    const macros = effect.flags.cat?.macros?.roll ?? [];
    macros.push({source, rules, identifier: 'frenzyDamage'});
    effect.updateSource({'flags.cat.macros.roll': macros, [`flags.${source}.frenzy`]: activity.uuid});
}
async function damageBonus({document: effect, macroClass: {identifier, source}, token, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!combatUtils.isOwnTurn(token)) return;
    if (!token.actor.flags[source]?.raging) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const activity = await fromUuid(effect.flags[source]?.frenzy);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Frenzy exited early without locating the frenzy activity. (reckless effect) ${effect.uuid}`);
    if (!activity.item.system.uses.value) return Logging.addMacroWarning(source, identifier, `Frenzy exited early without item uses. (frenzy activity) ${activity.uuid}`);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(frenzy.config));
    if (config.attackAbility.length && !config.attackAbility.includes(workflow.activity.ability)) return;
    const num = (await rollUtils.rollDice(config.number, {document: activity}))?.total;
    if (!num) return Logging.addMacroWarning(source, identifier, `Frenzy failed exited early due to a failed formula parse. (dice number) ${config.number} (dice denomination) ${config.denomination}`);
    return new DamageBonus(activity, {formula: num + config.denomination, optional: false})
        .withDefaultCosts()
        .withDefaultOnUse();
}
export const frenzy = {
    name: 'Frenzy',
    version: '2.1.4',
    rules: '2024',
    effect: [
        {
            pass: 'actorPreCreated',
            macro: reckless,
            priority: 200
        }
    ],
    config: {
        number: {
            default: '@scale.barbarian.rage-damage',
            type: 'text',
            category: 'behavior',
            label: 'CAT.MEDKIT.Summons.DamageNumber'
        },
        denomination: {
            default: 'd6',
            type: 'select',
            category: 'behavior',
            label: 'CAT.MEDKIT.Summons.DamageDenomination',
            get options() { return constants.diceSizeOptions; }
        },
        attackAbility: {
            default: ['str'],
            type: 'select-many',
            category: 'behavior',
            label: 'DND5E.ATTACK.FIELDS.attack.ability.label',
            get options() { return constants.abilityOptions; }
        },
        reckless: {
            default: 'recklessAttackEffect',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier'
        }
    }
};
export const frenzyDamage = {
    version: frenzy.version, 
    rules: frenzy.rules,
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damageBonus,
            priority: 200
        }
    ]
};
