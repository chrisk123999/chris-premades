import {actorUtils, automationUtils, combatUtils, constants, DamageBonus, documentUtils, effectUtils, itemUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig, identifiersConfig} from './damageBonusToOneRoll.mjs';
import {getCastDamageType} from './selectDamageType.mjs';
export const riderNearbyRangeConfig = {
    default: 0,
    type: 'number',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange',
    hint: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRangeHint'
};
export function withNearby(tokens, range) {
    if (!range) return tokens;
    return Array.from(new Set([...tokens, ...tokens.filter(token => token.object).flatMap(token => tokenUtils.findNearby(token, range)).filter(token => token.actor)]));
}
// Plays the configured rider animation on each hit target.
export function playRiderAnimation(document, identifier, targets, sourceToken) {
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier});
    if (animation?.macros?.play) targets.filter(target => target.object).forEach(target => animation.macros.play(target, options, {sourceToken}));
}
export function addRiders(workflow, uuids) {
    const riders = workflowUtils.getWorkflowProperty(workflow, 'attackRiders') ?? [];
    workflowUtils.setWorkflowProperty(workflow, 'attackRiders', [...riders, ...uuids]);
}
function applies(activity, actor, workflow, config) {
    if (!workflow.hitTargets.count || workflow.activity?.uuid === activity.uuid) return false;
    if (!itemUtils.getEquipmentState(activity.item)) return false;
    if (config.ownTurn && !combatUtils.isOwnTurn(workflow.token.document)) return false;
    if (activity.item.type === 'spell' && !itemUtils.canCast(activity.item)) return false;
    if (config.workflowProperty && !workflowUtils.getWorkflowProperty(workflow, config.workflowProperty)) return false;
    if (config.identifiers.length && !config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return false;
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return false;
    if (config.attackAbility.length && !config.attackAbility.includes(workflow.activity.ability)) return false;
    if (config.weaponTypes.length && !config.weaponTypes.includes(workflow.item.system.type?.value)) return false;
    if (config.singleTarget && workflow.hitTargets.count !== 1) return false;
    if (config.criticalOnly && !workflow.isCritical) return false;
    if (config.damageTypes.length) {
        const rolled = workflowUtils.getDamageTypes(workflow.damageRolls ?? []);
        if (!config.damageTypes.some(type => rolled.has(type))) return false;
    }
    if (config.maxSize) {
        const maxSize = CONFIG.DND5E.actorSizes[config.maxSize]?.numerical;
        if (workflow.hitTargets.documents.some(token => actorUtils.getSize(token.actor) > maxSize)) return false;
    }
    if (config.sizeAboveUser !== '' && workflow.hitTargets.documents.some(token => actorUtils.getSize(token.actor) > actorUtils.getSize(actor) + Number(config.sizeAboveUser))) return false;
    if (config.attackModes.length && !config.attackModes.includes(workflow.attackMode)) return false;
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
export function riderInput(name, label, riders, selected) {
    if (!riders.activities.length) return;
    return {
        name,
        label,
        options: {
            maxTotal: riders.limit,
            options: riders.activities.map(activity => ({value: activity.uuid, label: activity.name, image: activity.img})),
            onchange: ({input}) => selected.splice(0, selected.length, ...riders.activities.filter(activity => input.options.some(option => option.selected && option.value === activity.uuid)))
        }
    };
}
async function ownerBonus(activity, actor, workflow, config) {
    const riders = await getTaggedRiders(actor, workflow, config.ownsTag);
    if (!riders.activities.length) return;
    const selected = [];
    const bonus = new DamageBonus(activity, {formula: config.bonus, type: config.bonusDamageType})
        .withValidation(() => selected.length > 0)
        .withOnUse(async ({workflow}) => {
            addRiders(workflow, selected.map(rider => rider.uuid));
            await workflowUtils.completeActivityUse(activity, []);
        })
        .withInputs([['comboboxMulti', [riderInput(config.ownsTag, activity.name, riders, selected)]]]);
    if (!config.useActivityCosts) return bonus;
    bonus.withDefaultCosts();
    bonus.initialize(workflow);
    if (!DamageBonus.CheckCost(bonus)) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'Not enough uses or resources.');
    return bonus;
}
async function damage({document: activity, actor, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
    if (config.tag || !applies(activity, actor, workflow, config)) return;
    if (config.ownsTag) return await ownerBonus(activity, actor, workflow, config);
    const typeMatch = config.creatureTypeBonus && config.targetCreatureTypes.length && workflow.hitTargets.documents.every(token => token.actor && config.targetCreatureTypes.includes(actorUtils.typeOrRace(token.actor)));
    const formula = typeMatch ? config.bonus + ' + ' + config.creatureTypeBonus : config.bonus;
    const bonus = new DamageBonus(activity, {formula, type: config.bonusDamageType || getCastDamageType(activity.item), optional: !config.automatic})
        .withOnUse(({workflow, bonus}) => {
            addRiders(workflow, [bonus.document.uuid]);
            const scaling = Object.fromEntries(workflowUtils.getWorkflowProperty(workflow, 'attackRiderScaling') ?? []);
            workflowUtils.setWorkflowProperty(workflow, 'attackRiderScaling', Object.entries({...scaling, [bonus.document.uuid]: bonus.scalingIncrease}));
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
    const hitTargets = workflow.hitTargets.documents;
    const targets = selfOnly ? (token ? [token] : []) : withNearby(hitTargets, automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'riderNearbyRange'));
    const scaling = Object.fromEntries(workflowUtils.getWorkflowProperty(workflow, 'attackRiderScaling') ?? [])[activity.uuid] ?? 0;
    const options = {config: {scaling}};
    if (activity.item.system.linkedActivity) options.config.cause = {activity: activity.item.getFlag('dnd5e', 'cachedFor'), resources: true};
    else if (scaling && activity.isSpell) options.atLevel = activity.item.system.level + scaling;
    playRiderAnimation(activity, 'attackRider', hitTargets, workflow.token?.document);
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
 * - `bonusDamageType`: damage type of the extra damage. Empty uses the type chosen with `selectDamageType` at use, then the attack's damage type.
 * - `creatureTypeBonus`: extra damage added when every hit target is one of `targetCreatureTypes`.
 * - `targetCreatureTypes`: creature types that receive `creatureTypeBonus`.
 * - `tag`: tagged options are offered as choices under the bonus that owns the tag.
 * - `limit`: how many tagged options can be chosen for one damage roll.
 * - `ownsTag`: offer `bonus` once, with this tag's options as choices; at least one must be chosen.
 * - `workflowProperty`: only offer when an earlier bonus has set this workflow property.
 * - `identifiers`: only offer for attacks with items that have one of these identifiers.
 * - `attackType`: only offer for this attack type.
 * - `weaponTypes`: only offer for attacks with weapons of one of these types.
 * - `damageTypes`: only offer when the damage roll deals one of these damage types.
 * - `criticalOnly`: only offer on a critical hit.
 * - `singleTarget`: only offer when the attack hits exactly one target.
 * - `automatic`: apply the rider without offering it as a choice.
 * - `maxSize`: only offer when every hit target is this size or smaller.
 * - `sizeAboveUser`: only offer when every hit target is at most this many sizes larger than the attacker. Blank ignores size.
 * - `attackModes`: only offer for attacks made in one of these attack modes.
 * - `requiredItems`: only offer when the actor has an item with one of these identifiers.
 * - `suppressedBy`: do not offer when the actor has an item with one of these identifiers.
 * - `ownTurn`: in combat, only offer on the attacker's own turn.
 * - `selfAsTouch`: a Self range activity is rolled on the hit targets instead of the attacker.
 * - `riderNearbyRange`: the activity also targets creatures within this many feet of the hit targets. 0 targets the hit targets only.
 * - `useActivityCosts`: apply the activity's costs and scaling. Not offered when they cannot be paid.
 * - `animation`: played on each hit target when the rider is used.
 */
export const attackRider = {
    rules: 'all',
    version: '2.1.10',
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
        animation: {
            default: {source: 'none', identifier: 'none'},
            type: 'selectAnimation',
            inputs: ['targetToken'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RiderAnimationHint'
        },
        bonus: {
            default: '',
            type: 'formula',
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
            type: 'formula',
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
        ownsTag: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnsTag',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnsTagHint'
        },
        limit: {
            default: '1',
            type: 'formula',
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
        damageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageTypeHint',
            get options() { return constants.damageTypeOptions; }
        },
        criticalOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.CriticalOnly',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.CriticalOnlyHint'
        },
        singleTarget: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SingleTarget',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SingleTargetHint'
        },
        automatic: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Automatic',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.AutomaticHint'
        },
        weaponTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.WeaponTypesHint',
            get options() { return constants.weaponTypes; }
        },
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
        sizeAboveUser: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SizeAboveUser',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SizeAboveUserHint'
        },
        attackModes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.AttackModes',
            get options() { return Object.entries(CONFIG.DND5E.attackModes).map(([value, {label}]) => ({value, label})); }
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
