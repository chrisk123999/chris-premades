import {actorUtils, automationUtils, constants, DamageBonus, documentUtils, effectUtils, Logging, workflowUtils} from '../../proxy.mjs';
import {riderNearbyRangeConfig, withNearby} from './attackRider.mjs';
import {attackTypeConfig} from './damageBonusToOneRoll.mjs';
function getSpell(effect) {
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return {};
    const concentration = effectUtils.getConcentrationEffect(effect.parent, item);
    return {item, concentration, scaling: concentration?.flags.dnd5e?.scaling ?? effect.flags.dnd5e?.scaling ?? 0};
}
function getHitTargetUuids(effect, workflow, config) {
    if (config.bonus) return workflowUtils.getWorkflowProperty(workflow, 'nextHitRider')?.[effect.uuid];
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, config.attackType || 'attack')) return;
    const token = workflow.hitTargets.first();
    return [(token.document ?? token).uuid];
}
async function damage({document: effect, workflow}) {
    if (!workflow.hitTargets.size) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'nextHitRider', configKeys);
    if (!config.bonus || !workflowUtils.isAttackType(workflow, config.attackType || 'attack')) return;
    const {item, scaling} = getSpell(effect);
    if (!item) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(effect), 'Origin spell not found.', {notify: 'warn'});
    const roll = new CONFIG.Dice.DamageRoll(config.bonus, {...item.getRollData(), scaling});
    const bonus = new DamageBonus(effect, {roll, optional: false, maxTargets: 1, maxScaling: 0, type: config.bonusDamageType})
        .withOnUse(({workflow, bonus}) => {
            const riders = workflowUtils.getWorkflowProperty(workflow, 'nextHitRider') ?? {};
            workflowUtils.setWorkflowProperty(workflow, 'nextHitRider', {...riders, [effect.uuid]: Array.from(bonus.targets, token => token.uuid)});
        });
    bonus.targets = Array.from(workflow.hitTargets, token => token.document ?? token);
    return bonus;
}
async function rider({document: effect, workflow}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'nextHitRider', configKeys);
    const targetUuids = getHitTargetUuids(effect, workflow, config);
    if (!targetUuids) return;
    const {item, concentration, scaling} = getSpell(effect);
    const activity = config.rollActivity ? item?.system.activities.get(config.rollActivity) : undefined;
    const targets = withNearby(targetUuids.map(uuid => fromUuidSync(uuid, {strict: false})).filter(token => token?.actor), config.riderNearbyRange);
    const endFirst = config.endSpell === 'always';
    if (endFirst) await documentUtils.deleteDocument(concentration ?? effect);
    let riderWorkflow;
    if (activity && targets.length) {
        riderWorkflow = await workflowUtils.syntheticActivityRoll(activity, targets, {config: {scaling, concentration: {begin: false}}, consumeUsage: false, consumeResources: false, spellSlot: false});
    }
    if (endFirst) return;
    if (config.endSpell === 'onSave' && !riderWorkflow?.failedSaves?.size) {
        await documentUtils.deleteDocument(concentration ?? effect);
        return;
    }
    if (concentration && activity) {
        const created = targets.flatMap(token => actorUtils.getEffects(token.actor).filter(targetEffect => targetEffect.flags.dnd5e?.dependentOn !== concentration.uuid && effectUtils.getOriginActivitySync(targetEffect)?.uuid === activity.uuid));
        await documentUtils.makeDependent(concentration, created);
    }
    await documentUtils.deleteDocument(effect);
}
/**
 * Adds bonus damage to the next hit, then rolls a rider activity on the target and removes the effect. With no bonus, the next hit only triggers the rider.
 * Bound on an effect. Fires on `actorOptionalBonusDamage` and `actorRollFinished`.
 *
 * Config:
 * - `bonus`: extra damage added on the next hit. `@scaling` is the number of levels the spell was upcast.
 * - `bonusDamageType`: damage type of the bonus. None uses the attack's damage type.
 * - `attackType`: only trigger for this attack type. Empty matches any attack.
 * - `rollActivity`: activity rolled on the hit target after the bonus damage.
 * - `riderNearbyRange`: the rider activity also targets creatures within this many feet of the hit target. 0 targets the hit target only.
 * - `endSpell`: when the spell ends after the rider activity is rolled.
 */
export const nextHitRider = {
    rules: 'all',
    version: '2.0.4',
    category: 'damage',
    generic: true,
    documents: ['activeeffect'],
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        },
        {
            pass: 'actorRollFinished',
            macro: rider,
            priority: 200,
            canOverlap: true
        }
    ],
    genericConfig: {
        bonus: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageBonus',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.BonusHint'
        },
        bonusDamageType: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.BonusDamageTypeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.damageTypeOptions]; }
        },
        attackType: attackTypeConfig,
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.RollActivityHint'
        },
        riderNearbyRange: riderNearbyRangeConfig,
        endSpell: {
            default: 'never',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.NextHitRider.EndSpell',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.EndSpellHint',
            get options() { return ['never', 'always', 'onSave'].map(value => ({value, label: 'CHRISPREMADES.Macros.Generic.NextHitRider.EndSpellOptions.' + value})); }
        }
    }
};
const configKeys = Object.keys(nextHitRider.genericConfig);
