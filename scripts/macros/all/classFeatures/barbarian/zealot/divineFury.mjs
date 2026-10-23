import {automationUtils, combatUtils, constants, DamageBonus, genericUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function rageBegin({data, document: activity, macroClass: {source}}) {
    genericUtils.setProperty(data.effectData, `flags.${source}.divineFury`, activity.uuid);
    const macro = {source, rules: divineFury.rules, identifier: 'divineFuryDamage'};
    if (data.effectData.flags.cat?.macros?.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
}
async function damageBonus({document: effect, macroClass: {identifier, source}, token, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!combatUtils.isOwnTurn(token)) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const activity = await fromUuid(effect.flags[source]?.divineFury);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Divine Fury exited early without locating its use activity. (rage effect) ${effect.uuid}`);
    if (!activity.item.system.uses.value) return Logging.addMacroWarning(source, identifier, `Divine Fury exited early without item uses. (activity) ${activity.uuid}`);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(divineFury.config));
    const num = (await rollUtils.rollDice(config.extraFormula, {document: activity}))?.total;
    if (!num) return Logging.addMacroWarning(source, identifier, `Divine Fury failed exited early due to a failed formula parse. (base formula) ${config.baseFormula} (extra bonus) ${config.extraFormula}`);
    return new DamageBonus(activity, {formula: `${config.baseFormula} + ${num}`, optional: false, type: config.damageType})
        .withDefaultCosts()
        .withDefaultOnUse();
}
export const divineFury = {
    name: 'Divine Fury',
    version: '2.1.4',
    rules: 'all',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: rageBegin,
            priority: 250
        }
    ],
    config: {
        baseFormula: {
            default: '1d6',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageBonus'
        },
        extraFormula: {
            default: 'floor(@classes.barbarian.levels * 0.5)',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.All.DivineFury.FormulaHint'
        },
        damageType: {
            default: ['necrotic', 'radiant'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
export const divineFuryDamage = {
    version: divineFury.version,
    rules: divineFury.rules,
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damageBonus,
            priority: 200
        }
    ]
};
