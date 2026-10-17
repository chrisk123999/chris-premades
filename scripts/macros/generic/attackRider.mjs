import {actorUtils, automationUtils, combatUtils, constants, DamageBonus, documentUtils, effectUtils, itemUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig, identifiersConfig} from './damageBonusToOneRoll.mjs';
export const riderNearbyRangeConfig = {
    default: 0,
    type: 'number',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange',
    hint: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRangeHint'
};
export function withNearby(tokens, range) {
    if (!range) return tokens;
    return Array.from(new Set([...tokens, ...tokens.flatMap(token => tokenUtils.findNearby(token, range)).filter(token => token.actor)]));
}
export function addRiders(workflow, uuids) {
    const riders = workflowUtils.getWorkflowProperty(workflow, 'attackRiders') ?? [];
    workflowUtils.setWorkflowProperty(workflow, 'attackRiders', [...riders, ...uuids]);
}
function applies(activity, actor, workflow, config) {
    if (!workflow.hitTargets.size || workflow.activity?.uuid === activity.uuid) return false;
    if (config.ownTurn && !combatUtils.isOwnTurn(workflow.token)) return false;
    if (activity.item.type === 'spell' && !itemUtils.canCast(activity.item)) return false;
    if (config.workflowProperty && !workflowUtils.getWorkflowProperty(workflow, config.workflowProperty)) return false;
    if (config.identifiers.length && !config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return false;
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return false;
    if (config.attackAbility.length && !config.attackAbility.includes(workflow.activity.ability)) return false;
    if (config.maxSize) {
        const maxSize = CONFIG.DND5E.actorSizes[config.maxSize]?.numerical;
        if (workflow.hitTargets.some(token => actorUtils.getSize(token.actor) > maxSize)) return false;
    }
    if (config.requiredItems.length && !actorUtils.getItemByIdentifiers(actor, config.requiredItems)) return false;
    if (config.suppressedBy.length && actorUtils.getItemByIdentifiers(actor, config.suppressedBy)) return false;
    return true;
}
export async function getTaggedRiders(actor, workflow, tag) {
    const activities = actor.items.contents.flatMap(item => item.system.activities?.contents ?? []).filter(activity => {
        if (!activity.flags?.cat?.macros?.roll?.some(macro => macro.identifier === 'attackRider')) return false;
        const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
        return config.tag === tag && applies(activity, actor, workflow, config);
    });
    if (!activities.length) return {activities, limit: 0};
    const base = (await rollUtils.rollDice(automationUtils.getGenericConfigValue(activities[0], 'chris-premades', 'attackRider', 'limit'), {document: activities[0]})).total;
    const extra = await automationUtils.calledEvent('attackRiderLimit', actor, {multiResult: true, canOverlap: true, data: {tag, workflow}});
    return {activities, limit: base + extra.reduce((total, value) => total + (Number(value) || 0), 0)};
}
async function damage({document: activity, actor, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
    if (config.tag || !applies(activity, actor, workflow, config)) return;
    const typeMatch = config.creatureTypeBonus && config.targetCreatureTypes.length && workflow.hitTargets.every(token => token.actor && config.targetCreatureTypes.includes(actorUtils.typeOrRace(token.actor)));
    const formula = typeMatch ? config.bonus + ' + ' + config.creatureTypeBonus : config.bonus;
    const bonus = new DamageBonus(activity, {formula, type: config.bonusDamageType})
        .withOnUse(({workflow, bonus}) => {
            addRiders(workflow, [bonus.document.uuid]);
            const scaling = workflowUtils.getWorkflowProperty(workflow, 'attackRiderScaling') ?? {};
            workflowUtils.setWorkflowProperty(workflow, 'attackRiderScaling', {...scaling, [bonus.document.uuid]: bonus.scalingIncrease});
        });
    if (config.useActivityCosts) {
        bonus.withDefaultCosts();
        if (formula) bonus.withDefaultScaling();
        else bonus.withScalingHandler(({bonus: current}) => current.roll);
        bonus.initialize(workflow);
        if (!DamageBonus.CheckCost(bonus)) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'Not enough uses or resources.');
    }
    return bonus;
}
async function rider({document: activity, actor, token, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'attackRiders')?.includes(activity.uuid)) return;
    const selfOnly = activity.range.units === 'self' && !automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'selfAsTouch');
    const hitTargets = Array.from(workflow.hitTargets, target => target.document ?? target);
    const targets = selfOnly ? (token ? [token.document ?? token] : []) : withNearby(hitTargets, automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'riderNearbyRange'));
    const scaling = workflowUtils.getWorkflowProperty(workflow, 'attackRiderScaling')?.[activity.uuid] ?? 0;
    const options = {consumeUsage: false, config: {scaling}};
    if (activity.item.system.linkedActivity) options.config.cause = {activity: activity.item.getFlag('dnd5e', 'cachedFor'), resources: true};
    else if (scaling && activity.isSpell) options.atLevel = activity.item.system.level + scaling;
    const riderWorkflow = await workflowUtils.completeActivityUse(activity, targets, options);
    if (!riderWorkflow) return;
    if (scaling) {
        const created = targets.flatMap(target => target.actor ? actorUtils.getEffects(target.actor).filter(effect => !effect.flags.dnd5e?.scaling && effectUtils.getOriginActivitySync(effect)?.uuid === activity.uuid) : []);
        await Promise.all(created.map(effect => documentUtils.setFlag(effect, 'dnd5e', 'scaling', scaling)));
    }
    await automationUtils.calledEvent('attackRiderUsed', actor, {canOverlap: true, data: {activity, riderWorkflow, targets, workflow}});
}
/**
 * Offers this activity as an optional damage bonus on a hit, then rolls it on the hit targets.
 * Bound on an activity. Fires on `actorOptionalBonusDamage` and `actorRollFinished`.
 *
 * Config:
 * - `bonus`: extra damage added to the roll when this option is chosen.
 * - `bonusDamageType`: damage type of the extra damage. Empty uses the attack's damage type.
 * - `creatureTypeBonus`: extra damage added when every hit target is one of `targetCreatureTypes`.
 * - `targetCreatureTypes`: creature types that receive `creatureTypeBonus`.
 * - `tag`: tagged options are offered as choices under the bonus that owns the tag.
 * - `limit`: how many tagged options can be chosen for one damage roll.
 * - `workflowProperty`: only offer when an earlier bonus has set this workflow property.
 * - `identifiers`: only offer for attacks with items that have one of these identifiers.
 * - `attackType`: only offer for this attack type.
 * - `maxSize`: only offer when every hit target is this size or smaller.
 * - `requiredItems`: only offer when the actor has an item with one of these identifiers.
 * - `suppressedBy`: do not offer when the actor has an item with one of these identifiers.
 * - `ownTurn`: in combat, only offer on the attacker's own turn.
 * - `selfAsTouch`: a Self range activity is rolled on the hit targets instead of the attacker.
 * - `riderNearbyRange`: the activity also targets creatures within this many feet of the hit targets. 0 targets the hit targets only.
 * - `useActivityCosts`: apply the activity's costs and scaling. Not offered when they cannot be paid.
 */
export const attackRider = {
    rules: 'all',
    version: '2.0.4',
    category: 'damage',
    generic: true,
    documents: ['activity'],
    notes: 'Use the "actorAttackRiderLimit" called event (async) to raise how many riders sharing a tag can apply to one damage roll. Return a number, which is added to the limit.\n\tData available: tag, workflow.\nUse "actorAttackRiderUsed" (async) to respond after a rider activity is rolled.\n\tData available: activity, riderWorkflow, targets, workflow.',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 255
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
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.BonusHint'
        },
        bonusDamageType: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.BonusDamageTypeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.damageTypeOptions]; }
        },
        creatureTypeBonus: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.CreatureTypeBonus',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.CreatureTypeBonusHint'
        },
        targetCreatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.TargetCreatureTypes',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.TargetCreatureTypesHint',
            get options() { return constants.creatureTypeOptions; }
        },
        tag: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Tag',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.TagHint'
        },
        limit: {
            default: '1',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Limit',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.LimitHint'
        },
        workflowProperty: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.WorkflowProperty',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.WorkflowPropertyHint'
        },
        identifiers: identifiersConfig,
        attackType: attackTypeConfig,
        attackAbility: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Abilities',
            hint: 'CHRISPREMADES.Macros.Generic.RollBonus.AbilityHint',
            get options() { return constants.abilityOptions; }
        },
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.MaxSizeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        requiredItems: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.RequiredItems',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.RequiredItemsHint'
        },
        suppressedBy: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SuppressedBy',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SuppressedByHint'
        },
        ownTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnTurn',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnTurnHint'
        },
        selfAsTouch: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SelfAsTouch',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SelfAsTouchHint'
        },
        riderNearbyRange: riderNearbyRangeConfig,
        useActivityCosts: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Costs'
        }
    }
};
const configKeys = Object.keys(attackRider.genericConfig);
