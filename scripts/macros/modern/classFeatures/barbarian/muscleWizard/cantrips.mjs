import {automationUtils, combatUtils, constants, DamageBonus, effectUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function shockingGrasp({document: activity, macroClass: {identifier, source}, workflow}) {
    const effect = (activity.effects[0].effect ?? activity.item.effects.contents[0])?.toObject();
    if (!effect) return Logging.addMacroWarning(source, identifier, `"Cantrips" Shocking Grasp exited early due to a missing effect. (activity) ${activity.uuid}`);
    if (activity.actor.flags[source]?.raging) effect.duration.expiry = 'sourceStart';
    await Promise.all(workflow.targets.map(t => effectUtils.createEffects(t.actor, [effect])));
}
async function trueStrike({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!activity.item.system.uses.value) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.isOwnTurn(workflow.token.document)) return;
    const config = automationUtils.getConfigValues(activity.item, Object.keys(cantrips.config));
    if (config.attackAbility.length && !config.attackAbility.includes(workflow.activity.ability))
        return Logging.addMacroWarning(source, identifier, `"Cantrips" True Strike skipped on an invalid attack ability. (ability) ${workflow.activity.ability} (expected) ${config.attackAbility.join(', ')}`);
    let formula = config.bonus;
    if (activity.actor.flags[source]?.raging) {
        const bonus = (await rollUtils.rollDice(config.rageBonus, {document: activity}))?.total;
        if (bonus) formula += ` + ${bonus}`;
    }
    return new DamageBonus(activity, {formula})
        .withDefaultCosts()
        .withDefaultOnUse();
}
export const cantrips = {
    name: '"Cantrips"',
    version: '2.1.3',
    rules: '2024',
    config: {
        bonus: {
            default: '1d6',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Cantrips.TrueStrike'
        },
        rageBonus: {
            default: 'floor(@classes.barbarian.levels * 0.5)',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Cantrips.TrueStrikeRage'
        },
        attackAbility: {
            default: ['str'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.Cantrips.TrueStrikeAbility',
            hint: 'CHRISPREMADES.Macros.Generic.RollBonus.AbilityHint',
            get options() { return constants.abilityOptions; }
        }
    }
};
export const cantripsTrueStrike = {
    version: cantrips.version,
    rules: cantrips.rules,
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: trueStrike,
            priority: 200
        }
    ]
};
export const cantripsShockingGrasp = {
    version: cantrips.version,
    rules: cantrips.rules,
    roll: [
        {
            pass: 'activityRollFinished',
            macro: shockingGrasp,
            priority: 50
        }
    ]
};
