import {actorUtils, automationUtils, combatUtils, constants, DamageBonus, dataUtils, documentUtils, effectUtils, itemUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
export function hasRequiredSummons(actor, identifiers) {
    return !identifiers?.length || summonUtils.getSummons(actor).some(summon => summon.sourceItem && identifiers.includes(documentUtils.getIdentifier(summon.sourceItem)));
}
export const identifiersConfig = {
    default: [],
    type: 'selectIdentifiers',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Identifiers',
    hint: 'CHRISPREMADES.Macros.Generic.Common.Identifier.Hint'
};
export const attackTypeConfig = {
    default: '',
    type: 'select',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.AttackType.Label',
    hint: 'CHRISPREMADES.Macros.Generic.Common.AttackType.Hint',
    get options() { return constants.attackTypeOptions; }
};
function getSourceItem(document) {
    if (document.documentName === 'Item') return document;
    if (document.parent?.documentName === 'Item') return document.parent;
    const origin = effectUtils.getOriginSync(document);
    if (origin?.documentName === 'Item') return origin;
    if (origin?.documentName === 'ActiveEffect') return origin.parent?.documentName === 'Item' ? origin.parent : undefined;
    return origin?.item;
}
async function damage({document, workflow}) {
    if (!workflow.targets.count || (!workflow.activity.hasDamage && !workflow.activity.hasHealing)) return;
    if (!itemUtils.getEquipmentState(document)) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'damageBonusToOneRoll', configKeys);
    if (!config.bonus.length) return;
    if (config.excludeSelf && workflow.item && workflow.item.uuid === getSourceItem(document)?.uuid) return;
    if (config.ownTurn && workflow.token && !combatUtils.isOwnTurn(workflow.token.document)) return;
    const combatData = (config.oncePerTurn || config.oncePerTurnPerTarget) && workflow.token ? tokenUtils.getCombatData(workflow.token.document) : undefined;
    const stamps = document.flags['chris-premades']?.damageBonusToOneRoll?.stamps ?? [];
    if (config.oncePerTurn && combatData && combatUtils.isStampedThisTurn(stamps, workflow.token.id, combatData)) return;
    const bladeCantrip = workflow.item.flags['chris-premades']?.bladeCantrip;
    const multiSingleTarget = workflow.workflowOptions['chris-premades']?.multiSingleTarget;
    const trackLastUse = !config.everyRoll && multiSingleTarget;
    if (trackLastUse && document.flags['chris-premades']?.lastUse === multiSingleTarget.rollID) return;
    const needsHit = config.everyRoll || config.useActivityCosts || multiSingleTarget?.remainingAttacks > 1;
    const optional = !config.contextual && !config.everyRoll && needsHit;
    if (needsHit && workflow.activity.hasAttack && !workflow.hitTargets.count) return;
    if (config.applyTo === 'damage' && !workflow.activity.hasDamage) return;
    if (config.applyTo === 'healing' && !workflow.activity.hasHealing) return;
    if (config.attackType.length) {
        const thrown = config.thrownRanged && workflowUtils.isAttackType(workflow, 'rangedWeaponAttack') && workflow.item.system.properties?.has('thr');
        if (!thrown && !workflowUtils.isAttackType(workflow, config.attackType)) return;
    }
    if (config.damageType.length) {
        const rolled = workflowUtils.getDamageTypes(workflow.damageRolls);
        if (!config.damageType.some(d => rolled.has(d))) return;
    }
    if (config.healingType.length) {
        const heal = workflow.activity.healing;
        if (!heal) return;
        if (!config.healingType.some(d => heal.types.has(d))) return;
    }
    if (config.identifiers.length) {
        if (!config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return;
    }
    if (config.properties.length) {
        if (!config.properties.some(p => workflow.item.system.properties?.has(p))) return;
    }
    if (config.itemType.length) {
        if (bladeCantrip) {
            if (!['spell', 'weapon'].some(t => config.itemType.includes(t))) return;
        } else if (!config.itemType.includes(workflow.item.type)) return;
    }
    if (!hasRequiredSummons(workflow.actor, config.requiredSummons)) return;
    if (config.weaponTypes.length && !config.weaponTypes.includes(workflow.item.system.type?.value)) return;
    const classIdentifier = workflow.item.system.classIdentifier;
    if (config.sourceClasses && classIdentifier && !config.sourceClasses.split(',').map(value => value.trim()).includes(classIdentifier)) return;
    if (workflow.item.type === 'spell' || bladeCantrip) {
        if (config.spellLevel.length) {
            const castLevel = bladeCantrip ? 0 : workflowUtils.getCastLevel(workflow);
            if (!config.spellLevel.includes(String(castLevel))) return;
        }
        if (config.spellSchool.length) {
            const school = bladeCantrip?.school ?? workflow.item.system.school;
            if (!config.spellSchool.includes(school)) return;
        }
    }
    if (config.firstCastOnly && workflowUtils.isSustainedRoll(workflow)) return;
    const hasEffect = actor => !config.targetEffects.length || config.targetEffects.some(identifier => documentUtils.getEffectByIdentifier(actor, identifier, {multiple: true, sourceActor: workflow.actor}).length);
    const inRange = token => !config.attackerRange || (workflow.token && token.object && tokenUtils.isWithinDistance(workflow.token.document, token, config.attackerRange));
    const hasType = actor => !config.targetCreatureTypes.length || config.targetCreatureTypes.includes(actorUtils.typeOrRace(actor));
    const fresh = token => !config.oncePerTurnPerTarget || !combatData || !combatUtils.isStampedThisTurn(stamps, token.id, combatData);
    const wounded = actor => !config.targetWounded || !actor || actorUtils.isWounded(actor);
    const narrowed = config.requireHit || config.targetEffects.length || config.targetCreatureTypes.length || config.attackerRange || config.oncePerTurnPerTarget || config.targetWounded;
    const targets = narrowed ? (config.requireHit ? workflow.hitTargets : workflow.targets).documents.filter(token =>
        token.actor && hasEffect(token.actor) && hasType(token.actor) && inRange(token) && fresh(token) && wounded(token.actor)
    ) : undefined;
    if (targets && !targets.length) return;
    const bonus = new DamageBonus(document, {
        roll: new CONFIG.Dice.DamageRoll(config.bonus, dataUtils.getFormulaData({document, workflow})),
        maxTargets: config.maxTargets || undefined,
        allowCritical: config.allowCritical,
        type: config.bonusDamageType,
        optional
    }).withOnUse(async ({bonus}) => {
        if (trackLastUse) await documentUtils.setFlag(document, 'chris-premades', 'lastUse', multiSingleTarget.rollID);
        const usedOn = bonus.targets.size ? Array.from(bonus.targets) : workflow.hitTargets.documents;
        if (combatData?.inCombat) {
            let next = config.oncePerTurn ? combatUtils.addTurnStamp(stamps, workflow.token.id, combatData) : stamps;
            if (config.oncePerTurnPerTarget) next = usedOn.reduce((current, token) => combatUtils.addTurnStamp(current, token.id, combatData), next);
            await documentUtils.setFlag(document, 'chris-premades', 'damageBonusToOneRoll.stamps', next);
        }
        const used = workflowUtils.getWorkflowProperty(workflow, 'damageBonusToOneRoll') ?? {};
        workflowUtils.setWorkflowProperty(workflow, 'damageBonusToOneRoll', {...used, [document.uuid]: {formula: bonus.roll.formula, total: bonus.roll.total, type: bonus.roll.options.type, targets: usedOn.map(token => token.uuid)}});
        await workflowUtils.rollConfiguredSource(bonus, config, Array.from(bonus.targets ?? []));
    });
    if (targets) bonus.targets = bonus.targetOptions = targets;
    if (config.useActivityCosts) {
        if (!workflow.hitTargets.count) return;
        const activity = config.rollActivity ? document.system.activities?.get(config.rollActivity) : undefined;
        bonus.withDefaultCosts({activity}).initialize(workflow);
        if (!DamageBonus.CheckCost(bonus)) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(document), 'Not enough uses or resources.');
    }
    return bonus;
}
/**
 * Adds a bonus formula to the actor's matching damage or healing rolls, either offered as an optional bonus or applied
 * automatically. Its options limit which rolls and targets qualify. Each used bonus is recorded on the workflow
 * property `damageBonusToOneRoll`, keyed by the bonus document's uuid, as `{formula, total, type, targets}`.
 */
export const damageBonusToOneRoll = {
    rules: 'all',
    version: '2.1.11',
    category: 'damage',
    generic: true,
    documents: ['activeeffect', 'item'],
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        }
    ],
    genericConfig: {
        bonus: {
            default: '',
            type: 'formula',
            label: 'CHRISPREMADES.Config.DamageBonus',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Bonus.Hint',
            category: 'behavior'
        },
        contextual: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Contextual.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Contextual.Hint'
        },
        bonusDamageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.BonusDamageType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.BonusDamageType.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        applyTo: {
            default: 'damage',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.ApplyTo.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.ApplyTo.Hint',
            options: [
                {label: 'DND5E.HEAL.Type.HealingShort', value: 'healing'},
                {label: 'DND5E.Damage', value: 'damage'},
                {label: 'DND5E.DistAny', value: 'any'}
            ]
        },
        attackType: attackTypeConfig,
        thrownRanged: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.ThrownRanged.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.ThrownRanged.Hint'
        },
        damageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageType.Hint',
            get options() { return constants.damageTypeOptions; }
        },
        healingType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.HealingType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.HealingType.Hint',
            get options() { return constants.healingTypeOptions; }
        },
        identifiers: identifiersConfig,
        properties: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Properties',
            hint: 'CHRISPREMADES.Macros.Generic.Common.Property.Hint',
            get options() { return constants.itemProperties; }
        },
        itemType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemType.Hint',
            get options() { return constants.usableItemTypes; }
        },
        spellLevel: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellLevel.Hint',
            get options() { return constants.spellSlotOptions; }
        },
        weaponTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.WeaponTypes.Hint',
            get options() { return constants.weaponTypes; }
        },
        requiredSummons: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RequiredSummons.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RequiredSummons.Hint'
        },
        sourceClasses: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.SourceClasses.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.SourceClasses.Hint'
        },
        spellSchool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellSchool',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellSchool.Hint',
            get options() { return constants.spellSchoolOptions; }
        },
        firstCastOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.FirstCast.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.FirstCast.Hint'
        },
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Hint'
        },
        rollItem: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Common.RollItem.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.RollItem.Hint'
        },
        maxTargets: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets.Hint'
        },
        everyRoll: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.EveryRoll.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.EveryRoll.Hint'
        },
        requireHit: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.RequireHit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.RequireHit.Hint'
        },
        attackerRange: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.AttackerRange.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.AttackerRange.Hint'
        },
        targetWounded: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetWounded.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetWounded.Hint'
        },
        targetEffects: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetEffects.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetEffects.Hint'
        },
        targetCreatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetCreatureTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetCreatureTypes.Hint',
            get options() { return constants.creatureTypeOptions; }
        },
        useActivityCosts: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Common.Costs',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.UseActivityCosts.Hint'
        },
        allowCritical: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Critical.Label',
            hint:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Critical.Hint'
        },
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.OncePerTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.OncePerTurn.Hint'
        },
        ownTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.OwnTurn.Hint'
        },
        oncePerTurnPerTarget: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.OncePerTurnPerTarget.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.OncePerTurnPerTarget.Hint'
        },
        excludeSelf: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.ExcludeSelf.Label',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.ExcludeSelf.Hint'
        }
    }
};
const configKeys = Object.keys(damageBonusToOneRoll.genericConfig);
