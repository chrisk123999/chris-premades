import {automationUtils, constants, DamageBonus, documentUtils, workflowUtils} from '../../proxy.mjs';
async function damage({document, workflow}) {
    if (!workflow.targets.size || (!workflow.activity.hasDamage && !workflow.activity.hasHealing)) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'damageBonusToOneRoll', Object.keys(damageBonusToOneRoll.genericConfig));
    if (!config.bonus.length) return;
    const multiSingleTarget = workflow.workflowOptions['chris-premades']?.multiSingleTarget;
    if (multiSingleTarget && document.flags['chris-premades']?.lastUse === multiSingleTarget.rollID) return;
    const optional = config.useActivityCosts || (multiSingleTarget ? multiSingleTarget.remainingAttacks > 1 : false);
    if (optional && workflow.activity.hasAttack && !workflow.hitTargets.size) return;
    if (config.attackType.length) {   
        if (!workflowUtils.isAttackType(workflow, config.attackType)) return;
    }
    if (config.damageType.length) {
        const damage = workflow.activity.damage ?? workflow.activity.otherActivity?.damage;
        if (!damage) return;
        if (!damage.parts.some(p => config.damageType.some(d => p.types.has(d)))) return;
    }
    if (config.healingType.length) {
        const heal = workflow.activity.healing;
        if (!heal) return;
        if (!config.healingType.some(d => heal.types.has(d))) return;
    }
    if (config.identifiers.length) {
        if (!config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return;
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
    const bonus = new DamageBonus(document, {formula: config.bonus, optional, type: config.bonusDamageType, allowCritical: config.allowCritical})
        .withOnUse(async ({bonus}) => {
            if (multiSingleTarget) await documentUtils.setFlag(document, 'chris-premades', 'lastUse', multiSingleTarget.rollID);
            const item = bonus.document.documentName === 'Item' ? bonus.document : bonus.activity?.item;
            if (!item) return;
            if (config.rollItem) {
                await workflowUtils.completeItemUse(item, Array.from(bonus.targets ?? []));
            } else if (config.rollActivity) {
                const activity = item.system.activities.get(config.rollActivity);
                if (!activity) return;
                await workflowUtils.completeActivityUse(activity, Array.from(bonus.targets ?? []));
            }
        });
    if (config.useActivityCosts) {
        if (!workflow.hitTargets.size) return;
        bonus.withDefaultCosts().initialize(workflow);
        if (!DamageBonus.CheckCost(bonus)) return;
    } else
        bonus.initialize(workflow);
    return bonus;
}
export const damageBonusToOneRoll = {
    rules: 'all',
    version: '2.0.3',
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
        attackType: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            hint: 'CHRISPREMADES.Macros.Generic.Common.AttackTypeHint',
            get options() { return [
                'attack',
                'meleeAttack',
                'rangedAttack',
                'weaponAttack',
                'spellAttack',
                'rangedWeaponAttack',
                'meleeWeaponAttack',
                'rangedSpellAttack',
                'meleeSpellAttack'
            ].map(a => ({value: a, label: _loc('CHRISPREMADES.Config.AttackType.' + a)})); }
        },
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
            get options() { return constants.damageTypeOptions(); }
        },
        damageType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageTypeHint',
            get options() { return constants.damageTypeOptions(); }
        },
        healingType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.HealingType',
            hint: 'CHRISPREMADES.Macros.Generic.Common.HealingTypeHint',
            get options() { return constants.healingTypeOptions(); }
        },
        identifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.Common.IdentifierHint'
        },
        itemType: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemTypeHint',
            get options() { return constants.usableItemTypes(); }
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
        spellLevel: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellLevelHint',
            get options() { return constants.spellSlotOptions(); }
        },
        spellSchool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SpellSchool',
            hint: 'CHRISPREMADES.Macros.Generic.Common.SpellSchoolHint',
            get options() { return constants.spellSchoolOptions(); }
        },
        useActivityCosts: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label:'CHRISPREMADES.Macros.Generic.DamageBonusToOneRoll.Costs'
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
