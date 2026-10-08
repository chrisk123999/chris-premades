import {actorUtils, automationUtils, constants, DamageBonus, documentUtils, workflowUtils} from '../../proxy.mjs';
export const identifiersConfig = {
    default: [],
    type: 'selectIdentifiers',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.Identifiers',
    hint: 'CHRISPREMADES.Macros.Generic.Common.IdentifierHint'
};
export const attackTypeConfig = {
    default: '',
    type: 'select',
    category: 'behavior',
    label: 'CHRISPREMADES.Config.AttackType.Label',
    hint: 'CHRISPREMADES.Macros.Generic.Common.AttackTypeHint',
    get options() { return constants.attackTypeOptions; }
};
async function damage({document, workflow}) {
    if (!workflow.targets.size || (!workflow.activity.hasDamage && !workflow.activity.hasHealing)) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'damageBonusToOneRoll', configKeys);
    if (!config.bonus.length) return;
    const multiSingleTarget = workflow.workflowOptions['chris-premades']?.multiSingleTarget;
    const trackLastUse = !config.everyRoll && multiSingleTarget;
    if (trackLastUse && document.flags['chris-premades']?.lastUse === multiSingleTarget.rollID) return;
    const needsHit = config.everyRoll || config.useActivityCosts || multiSingleTarget?.remainingAttacks > 1;
    const optional = !config.everyRoll && needsHit;
    if (needsHit && workflow.activity.hasAttack && !workflow.hitTargets.size) return;
    if (config.attackType.length) {
        if (!workflowUtils.isAttackType(workflow, config.attackType)) return;
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
        if (!config.itemType.includes(workflow.item.type)) return;
    }
    if (config.spellLevel.length) {
        if(!config.spellLevel.includes(String(workflowUtils.getCastLevel(workflow)))) return;
    }
    if (config.spellSchool.length) {
        if (!config.spellSchool.includes(workflow.item.system.school)) return;
    }
    if (config.targetWounded) {
        const actor = (workflow.hitTargets.first() ?? workflow.targets.first())?.actor;
        if (!actor || !actorUtils.isWounded(actor)) return;
    }
    const hasEffect = actor => !config.targetEffects.length || config.targetEffects.some(identifier => documentUtils.getEffectByIdentifier(actor, identifier, {multiple: true, sourceActor: workflow.actor}).length);
    const hasType = actor => !config.targetCreatureTypes.length || config.targetCreatureTypes.includes(actorUtils.typeOrRace(actor));
    const narrowed = config.targetEffects.length || config.targetCreatureTypes.length;
    const targets = narrowed ? workflow.hitTargets.filter(token => token.actor && hasEffect(token.actor) && hasType(token.actor)) : undefined;
    if (targets && !targets.size) return;
    const bonus = new DamageBonus(document, {formula: config.bonus, optional, type: config.bonusDamageType, maxTargets: config.maxTargets || undefined, allowCritical: config.allowCritical})
        .withOnUse(async ({bonus}) => {
            if (trackLastUse) await documentUtils.setFlag(document, 'chris-premades', 'lastUse', multiSingleTarget.rollID);
            await workflowUtils.rollConfiguredSource(bonus, config, Array.from(bonus.targets ?? []));
        });
    if (targets) bonus.targets = targets.map(token => token.document);
    if (config.useActivityCosts) {
        if (!workflow.hitTargets.size) return;
        bonus.withDefaultCosts().initialize(workflow);
        if (!DamageBonus.CheckCost(bonus)) return;
    }
    return bonus;
}
export const damageBonusToOneRoll = {
    rules: 'all',
    version: '2.3.0',
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
            type: 'text',
            label: 'CHRISPREMADES.Config.DamageBonus',
            category: 'behavior'
        },
        bonusDamageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.BonusDamageType',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.BonusDamageTypeHint',
            get options() { return constants.damageTypeOptions; }
        },
        attackType: attackTypeConfig,
        damageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageTypeHint',
            get options() { return constants.damageTypeOptions; }
        },
        healingType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.HealingType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.HealingTypeHint',
            get options() { return constants.healingTypeOptions; }
        },
        identifiers: identifiersConfig,
        properties: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Properties',
            hint: 'CHRISPREMADES.Macros.Generic.Common.PropertyHint',
            get options() { return constants.itemProperties; }
        },
        itemType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemTypeHint',
            get options() { return constants.usableItemTypes; }
        },
        spellLevel: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellLevelHint',
            get options() { return constants.spellSlotOptions; }
        },
        spellSchool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellSchool',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellSchoolHint',
            get options() { return constants.spellSchoolOptions; }
        },
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity'
        },
        rollItem: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Common.RollItem'
        },
        maxTargets: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargets',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.MaxTargetsHint'
        },
        everyRoll: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.EveryRoll',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.EveryRollHint'
        },
        targetWounded: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetWounded',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetWoundedHint'
        },
        targetEffects: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetEffects',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetEffectsHint'
        },
        targetCreatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetCreatureTypes',
            hint: 'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.TargetCreatureTypesHint',
            get options() { return constants.creatureTypeOptions; }
        },
        useActivityCosts: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.Common.Costs'
        },
        allowCritical: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Critical',
            hint:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.CriticalHint'
        }
    }
};
const configKeys = Object.keys(damageBonusToOneRoll.genericConfig);
