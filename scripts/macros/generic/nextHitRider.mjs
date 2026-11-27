import {actorUtils, automationUtils, constants, DamageBonus, documentUtils, effectUtils, Logging, workflowUtils} from '../../proxy.mjs';
import {playRiderAnimation, riderNearbyRangeConfig, withNearby} from './attackRider.mjs';
import {attackTypeConfig} from './damageBonusToOneRoll.mjs';
function getSpell(effect) {
    const item = effectUtils.getOriginActivitySync(effect)?.item;
    if (!item) return {};
    const concentration = effectUtils.getConcentrationEffect(effect.parent, item);
    return {item, concentration, scaling: concentration?.flags.dnd5e?.scaling ?? effect.flags.dnd5e?.scaling ?? 0};
}
function getHitTargetUuids(effect, workflow, config) {
    if (config.bonus) return Object.fromEntries(workflowUtils.getWorkflowProperty(workflow, 'nextHitRider') ?? [])[effect.uuid];
    if (!workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, config.attackType || 'attack')) return;
    return [workflow.hitTargets.uuids[0]];
}
function weaponMatches(config, workflow) {
    return !config.weaponTypes.length || config.weaponTypes.includes(workflow.item?.system.type?.value);
}
function isAttacked(effect, workflow) {
    return workflow.targets.documents.some(token => token.actor?.uuid === effect.parent?.uuid);
}
async function damage({document: effect, workflow}) {
    if (!workflow.hitTargets.count) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'nextHitRider', configKeys);
    if (!config.bonus || !workflowUtils.isAttackType(workflow, config.attackType || 'attack') || !weaponMatches(config, workflow)) return;
    if (config.incoming) return;
    const {item, scaling} = getSpell(effect);
    if (!item) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(effect), 'Origin spell not found.', {notify: 'warn'});
    const roll = new CONFIG.Dice.DamageRoll(config.bonus, {...item.getRollData(), scaling});
    const bonus = new DamageBonus(effect, {roll, optional: false, maxTargets: 1, maxScaling: 0, type: config.bonusDamageType})
        .withOnUse(({workflow, bonus}) => {
            const riders = Object.fromEntries(workflowUtils.getWorkflowProperty(workflow, 'nextHitRider') ?? []);
            workflowUtils.setWorkflowProperty(workflow, 'nextHitRider', Object.entries({...riders, [effect.uuid]: Array.from(bonus.targets, token => token.uuid)}));
        });
    bonus.targets = workflow.hitTargets.documents;
    return bonus;
}
async function incomingDamage({document: effect, workflow}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'nextHitRider', configKeys);
    if (!config.incoming || !config.bonus || !workflowUtils.isAttackType(workflow, config.attackType || 'attack')) return;
    const targets = workflow.hitTargets.documents.filter(token => token.actor?.uuid === effect.parent?.uuid);
    if (!targets.length) return;
    const {item, scaling} = getSpell(effect);
    const roll = new CONFIG.Dice.DamageRoll(config.bonus, {...item?.getRollData(), scaling});
    const bonus = new DamageBonus(effect, {roll, optional: false, maxTargets: 1, maxScaling: 0, type: config.bonusDamageType});
    bonus.targets = targets;
    return bonus;
}
async function incomingRider({document: effect, workflow}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'nextHitRider', configKeys);
    if (!config.incoming || !workflowUtils.isAttackType(workflow, config.attackType || 'attack') || !isAttacked(effect, workflow)) return;
    await documentUtils.deleteDocument(effect);
}
async function rider({document: effect, workflow}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'nextHitRider', configKeys);
    if (config.incoming || !weaponMatches(config, workflow)) return;
    const targetUuids = getHitTargetUuids(effect, workflow, config);
    if (!targetUuids) {
        if (config.consumeOnMiss && !workflow.hitTargets.count && workflowUtils.isAttackType(workflow, config.attackType || 'attack')) await documentUtils.deleteDocument(effect);
        return;
    }
    const {item, concentration, scaling} = getSpell(effect);
    const activity = config.rollActivity ? item?.system.activities.get(config.rollActivity) : undefined;
    const hitTokens = targetUuids.map(uuid => fromUuidSync(uuid, {strict: false})).filter(Boolean);
    const targets = withNearby(hitTokens.filter(token => token.actor), config.riderNearbyRange);
    playRiderAnimation(effect, 'nextHitRider', hitTokens, workflow.token?.document);
    const endFirst = config.endSpell === 'always';
    if (endFirst) await documentUtils.deleteDocument(concentration ?? effect);
    let riderWorkflow;
    if (activity && targets.length) {
        riderWorkflow = await workflowUtils.syntheticActivityRoll(activity, targets, {config: {scaling, concentration: {begin: false}}, consumeResources: false, spellSlot: false});
    }
    if (endFirst) return;
    if (config.endSpell === 'onSave' && !riderWorkflow?.failedSaves?.count) {
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
 * Adds bonus damage to the actor's next hit, then rolls a rider activity from the origin spell on the target and removes
 * the effect. With no bonus, the next hit only triggers the rider. Effects the rider creates on its targets end when the
 * spell's concentration ends.
 */
export const nextHitRider = {
    rules: 'all',
    version: '2.1.11',
    category: 'damage',
    generic: true,
    documents: ['activeeffect'],
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250,
            canOverlap: true
        },
        {
            pass: 'actorRollFinished',
            macro: rider,
            priority: 200,
            canOverlap: true
        },
        {
            pass: 'targetOptionalBonusDamage',
            macro: incomingDamage,
            priority: 250,
            canOverlap: true
        },
        {
            pass: 'targetRollFinished',
            macro: incomingRider,
            priority: 200,
            canOverlap: true
        }
    ],
    genericConfig: {
        animation: {
            default: {source: 'none', identifier: 'none'},
            type: 'selectAnimation',
            inputs: ['targetToken'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RiderAnimation.Hint'
        },
        bonus: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageBonus',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.Bonus.Hint'
        },
        bonusDamageType: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.BonusDamageType.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.damageTypeOptions]; }
        },
        attackType: attackTypeConfig,
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.RollActivity.Hint'
        },
        riderNearbyRange: riderNearbyRangeConfig,
        endSpell: {
            default: 'never',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.NextHitRider.EndSpell.Label',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.EndSpell.Hint',
            get options() { return ['never', 'always', 'onSave'].map(value => ({value, label: 'CHRISPREMADES.Macros.Generic.NextHitRider.EndSpellOptions.' + value})); }
        },
        weaponTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.WeaponTypes.Hint',
            get options() { return constants.weaponTypes; }
        },
        consumeOnMiss: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.NextHitRider.ConsumeOnMiss.Label',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.ConsumeOnMiss.Hint'
        },
        incoming: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.NextHitRider.Incoming.Label',
            hint: 'CHRISPREMADES.Macros.Generic.NextHitRider.Incoming.Hint'
        }
    }
};
const configKeys = Object.keys(nextHitRider.genericConfig);
