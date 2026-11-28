import {activityUtils, actorUtils, automationUtils, combatUtils, constants, DamageBonus, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, queryUtils, rollUtils, summonUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig, identifiersConfig} from './damageBonusToOneRoll.mjs';
import {getCastDamageType} from './selectDamageType.mjs';
export const riderNearbyRangeConfig = {
    default: 0,
    type: 'number',
    category: 'behavior',
    label: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange.Label',
    hint: 'CHRISPREMADES.Macros.Generic.Common.RiderNearbyRange.Hint'
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
    if (activity.consumption.targets.length && !activityUtils.checkCosts(activity)) return false;
    const own = workflow.actor?.uuid === actor.uuid;
    if (own && config.identifiers.length && !config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return false;
    if (own && config.excludeIdentifiers.length && config.excludeIdentifiers.includes(documentUtils.getIdentifier(workflow.item))) return false;
    if (config.attackType && !workflowUtils.isAttackType(workflow, own ? config.attackType : 'attack')) return false;
    if (own && config.attackAbility.length && !config.attackAbility.includes(workflow.activity.ability)) return false;
    if (own && config.weaponTypes.length && !config.weaponTypes.includes(workflow.item.system.type?.value)) return false;
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
    if (config.itemFlag && !genericUtils.getProperty(workflow.item, config.itemFlag)) return false;
    if (!config.bonus && config.creatureTypeBonus && config.targetCreatureTypes.length && !workflow.hitTargets.documents.every(token => token.actor && config.targetCreatureTypes.includes(actorUtils.typeOrRace(token.actor)))) return false;
    if (config.targetEffects.length && workflow.hitTargets.documents.some(token => !config.targetEffects.some(identifier => documentUtils.getEffectByIdentifier(token.actor, identifier, {sourceActor: actor})))) return false;
    if (own && config.properties.length && !config.properties.some(property => workflow.item.system.properties?.has(property))) return false;
    if (config.oncePerTurn && isStamped(activity, config)) return false;
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
function turnData(activity) {
    const token = actorUtils.getFirstToken(activity.actor);
    return token ? {token, combatData: tokenUtils.getCombatData(token)} : {};
}
function turnCount(activity) {
    const {token, combatData} = turnData(activity);
    const stamps = activity.item.flags['chris-premades']?.attackRider?.stamps;
    if (!token || !combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return 0;
    return stamps.find(entry => entry.id === token.id)?.count ?? 1;
}
function isStamped(activity, config) {
    const limit = config.turnLimit ? rollUtils.rollDiceSync(config.turnLimit, {document: activity}).total : 1;
    return turnCount(activity) >= Math.max(limit, 1);
}
async function stamp(activity) {
    const {token, combatData} = turnData(activity);
    if (!combatData?.inCombat) return;
    const count = turnCount(activity) + 1;
    const stamps = combatUtils.addTurnStamp(activity.item.flags['chris-premades']?.attackRider?.stamps ?? [], token.id, combatData).map(entry => entry.id === token.id ? {...entry, count} : entry);
    await documentUtils.setFlag(activity.item, 'chris-premades', 'attackRider.stamps', stamps);
}
function isOwnedSummon(activity, workflow, config) {
    if (!config.summonAttacks.length || workflow.actor?.uuid === activity.actor.uuid) return false;
    const summon = summonUtils.getSummonData(workflow.actor);
    if (summon?.ownerUuid !== activity.actor.uuid) return false;
    const source = summon.sourceDocument;
    return config.summonAttacks.includes(documentUtils.getIdentifier(source?.item ?? source));
}
async function ownerBonus(activity, actor, workflow, config) {
    const riders = await getTaggedRiders(actor, workflow, config.ownsTag);
    if (!riders.activities.length) return;
    const selected = [];
    const bonus = new DamageBonus(activity, {formula: config.bonus, type: config.bonusDamageType})
        .withValidation(() => selected.length > 0)
        .withOnUse(async ({workflow}) => {
            addRiders(workflow, selected.map(rider => rider.uuid));
            if (config.oncePerTurn) await stamp(activity);
            await workflowUtils.completeActivityUse(activity, []);
        })
        .withInputs([['comboboxMulti', [riderInput(config.ownsTag, activity.name, riders, selected)]]]);
    if (!config.useActivityCosts) return bonus;
    bonus.withDefaultCosts();
    bonus.initialize(workflow);
    if (!DamageBonus.CheckCost(bonus)) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(activity.item), 'Not enough uses or resources.');
    return bonus;
}
async function damage({document: activity, actor, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
    if (config.tag || !applies(activity, actor, workflow, config)) return;
    if (config.ownsTag) return await ownerBonus(activity, actor, workflow, config);
    const typeMatch = config.creatureTypeBonus && config.targetCreatureTypes.length && workflow.hitTargets.documents.every(token => token.actor && config.targetCreatureTypes.includes(actorUtils.typeOrRace(token.actor)));
    const formula = typeMatch ? config.bonus + ' + ' + config.creatureTypeBonus : config.bonus;
    const flagType = config.itemFlag ? genericUtils.getProperty(workflow.item, config.itemFlag) : undefined;
    const type = config.matchDamageType ? undefined : config.bonusDamageType || (CONFIG.DND5E.damageTypes[flagType] ? flagType : getCastDamageType(activity.item));
    const bonus = new DamageBonus(activity, {formula, type, optional: !config.automatic})
        .withOnUse(async ({workflow, bonus}) => {
            addRiders(workflow, [bonus.document.uuid]);
            if (config.oncePerTurn && !config.riderPick) await stamp(activity);
            const scaling = Object.fromEntries(workflowUtils.getWorkflowProperty(workflow, 'attackRiderScaling') ?? []);
            workflowUtils.setWorkflowProperty(workflow, 'attackRiderScaling', Object.entries({...scaling, [bonus.document.uuid]: bonus.scalingIncrease}));
        });
    if (config.useActivityCosts) {
        bonus.withDefaultCosts();
        if (formula) bonus.withDefaultScaling();
        else bonus.withScalingHandler(({bonus: current}) => current.roll);
        bonus.initialize(workflow);
        if (!DamageBonus.CheckCost(bonus)) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(activity.item), 'Not enough uses or resources.');
    }
    return bonus;
}
async function rider({document: activity, actor, token, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'attackRiders')?.includes(activity.uuid)) return;
    const selfOnly = activity.range.units === 'self' && !automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'selfAsTouch');
    const hitTargets = workflow.hitTargets.documents;
    let targets = selfOnly ? (token ? [token] : []) : withNearby(hitTargets, automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'riderNearbyRange'));
    const viewer = actorUtils.getFirstToken(activity.actor);
    if (activity.midiProperties?.targetMustBeSeen && viewer) targets = targets.filter(target => tokenUtils.canSee(viewer, target));
    if (!selfOnly && automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'riderPick')) {
        const selection = await dialogUtils.selectTargetDialog(activity.name, 'CHRISPREMADES.Macros.Generic.AttackRider.RiderPickPrompt', targets, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(activity.actor, true)});
        if (!selection?.result) return;
        targets = [selection.result];
        if (automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'oncePerTurn')) await stamp(activity);
    }
    const scaling = Object.fromEntries(workflowUtils.getWorkflowProperty(workflow, 'attackRiderScaling') ?? [])[activity.uuid] ?? 0;
    const options = {config: {scaling}};
    if (workflowUtils.getWorkflowProperty(workflow, 'maximizeDamage')) options.options = {workflowOptions: {cat: {maximizeDamage: true}}};
    if (activity.item.system.linkedActivity) options.config.cause = {activity: activity.item.getFlag('dnd5e', 'cachedFor'), resources: true};
    else if (scaling && activity.isSpell) options.atLevel = activity.item.system.level + scaling;
    playRiderAnimation(activity, 'attackRider', hitTargets, workflow.token?.document);
    const matchType = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'matchDamageType') ? workflowUtils.getDamageTypes(workflow.damageRolls ?? []).first() : undefined;
    let riderWorkflow;
    if (matchType && activity.damage?.parts?.length) {
        const activityData = activity.toObject();
        activityData.damage.parts.forEach(part => part.types = [matchType]);
        riderWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, activity.item, targets, options);
    } else riderWorkflow = await workflowUtils.completeActivityUse(activity, targets, options);
    if (!riderWorkflow) return;
    if (scaling) {
        const created = targets.flatMap(target => target.actor ? actorUtils.getEffects(target.actor).filter(effect => !effect.flags.dnd5e?.scaling && effectUtils.getOriginActivitySync(effect)?.uuid === activity.uuid) : []);
        await Promise.all(created.map(effect => documentUtils.setFlag(effect, 'dnd5e', 'scaling', scaling)));
    }
    await automationUtils.calledEvent('attackRiderUsed', actor, {canOverlap: true, data: {activity, riderWorkflow, targets, workflow}});
}
async function maximized({workflow}) {
    if (!workflow.damageRolls?.length || !workflowUtils.getWorkflowProperty(workflow, 'maximizeDamage')) return;
    await workflow.setDamageRolls(await Promise.all(workflow.damageRolls.map(roll => roll.reroll({maximize: true}))));
}
async function summonDamage({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
    if (!isOwnedSummon(activity, workflow, config)) return;
    return (await damage({document: activity, actor: activity.actor, workflow}))?.withDefaultRequest();
}
async function summonRider({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
    if (!isOwnedSummon(activity, workflow, config)) return;
    await rider({document: activity, actor: activity.actor, token: actorUtils.getFirstToken(activity.actor), workflow});
}
/**
 * Offers this activity as an optional damage bonus when an attack hits, then rolls the activity on the hit targets.
 * Its options limit which attacks offer it. Riders that share a tag can be grouped under one bonus, and the attacker
 * picks which of them to apply.
 */
export const attackRider = {
    rules: 'all',
    version: '2.1.11',
    category: 'damage',
    generic: true,
    documents: ['activity'],
    notes: 'Use the "actorAttackRiderLimit" called event (async) to raise how many riders sharing a tag can apply to one damage roll. Return a number, which is added to the limit.\n\tData available: tag, workflow.\nUse "actorAttackRiderUsed" (async) to respond after a rider activity is rolled.\n\tData available: activity, riderWorkflow, targets, workflow.',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 255,
            canOverlap: true
        },
        {
            pass: 'actorRollFinished',
            macro: rider,
            priority: 200,
            canOverlap: true
        },
        {
            pass: 'activityDamageRollComplete',
            macro: maximized,
            priority: 450
        },
        {
            pass: 'sceneOptionalBonusDamage',
            macro: summonDamage,
            priority: 255,
            canOverlap: true
        },
        {
            pass: 'sceneRollFinished',
            macro: summonRider,
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
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.Bonus.Hint'
        },
        bonusDamageType: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.BonusDamageType.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.damageTypeOptions]; }
        },
        creatureTypeBonus: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.CreatureTypeBonus.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.CreatureTypeBonus.Hint'
        },
        targetCreatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.TargetCreatureTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.TargetCreatureTypes.Hint',
            get options() { return constants.creatureTypeOptions; }
        },
        tag: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Tag.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.Tag.Hint'
        },
        ownsTag: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnsTag.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnsTag.Hint'
        },
        limit: {
            default: '1',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Limit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.Limit.Hint'
        },
        workflowProperty: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.WorkflowProperty.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.WorkflowProperty.Hint'
        },
        identifiers: identifiersConfig,
        excludeIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.ExcludeIdentifiers.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.ExcludeIdentifiers.Hint'
        },
        attackType: attackTypeConfig,
        damageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageType.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        criticalOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.CriticalOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.CriticalOnly.Hint'
        },
        singleTarget: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SingleTarget.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SingleTarget.Hint'
        },
        automatic: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Automatic.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.Automatic.Hint'
        },
        weaponTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.WeaponTypes.Hint',
            get options() { return constants.weaponTypes; }
        },
        attackAbility: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Abilities',
            hint: 'CHRISPREMADES.Macros.Generic.RollBonus.Ability.Hint',
            get options() { return constants.abilityOptions; }
        },
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.MaxSize.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        sizeAboveUser: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SizeAboveUser.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SizeAboveUser.Hint'
        },
        attackModes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.AttackModes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.AttackModes.Hint',
            get options() { return Object.entries(CONFIG.DND5E.attackModes).map(([value, {label}]) => ({value, label})); }
        },
        requiredItems: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.RequiredItems.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.RequiredItems.Hint'
        },
        suppressedBy: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SuppressedBy.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SuppressedBy.Hint'
        },
        ownTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnTurn.Hint'
        },
        matchDamageType: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.MatchDamageType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.MatchDamageType.Hint'
        },
        selfAsTouch: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SelfAsTouch.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SelfAsTouch.Hint'
        },
        riderNearbyRange: riderNearbyRangeConfig,
        riderPick: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.RiderPick.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.RiderPick.Hint'
        },
        properties: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Properties',
            hint: 'CHRISPREMADES.Macros.Generic.Common.Property.Hint',
            get options() { return constants.itemProperties; }
        },
        turnLimit: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.TurnLimit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.TurnLimit.Hint'
        },
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.OncePerTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.OncePerTurn.Hint'
        },
        itemFlag: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.ItemFlag.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.ItemFlag.Hint'
        },
        targetEffects: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.TargetEffects.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.TargetEffects.Hint'
        },
        summonAttacks: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SummonAttacks.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SummonAttacks.Hint'
        },
        useActivityCosts: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Costs',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.Costs.Hint'
        }
    }
};
const configKeys = Object.keys(attackRider.genericConfig);
