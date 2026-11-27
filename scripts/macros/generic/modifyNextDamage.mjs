import {automationUtils, constants, documentUtils, effectUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig} from './damageBonusToOneRoll.mjs';
function matches(config, workflow) {
    if (config.itemTypes.length && !config.itemTypes.includes(workflow.item.type)) return false;
    if (workflow.item.type === 'spell' && workflowUtils.getCastLevel(workflow) > config.maxSpellLevel) return false;
    if (config.weaponTypes.length && !config.weaponTypes.includes(workflow.item.system.type?.value)) return false;
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return false;
    return true;
}
async function apply(effect, workflow, config) {
    if (config.requireHit && workflow.activity?.hasAttack && !workflow.hitTargets.count) return;
    const rolls = config.mode === 'double' ? [...workflow.damageRolls, ...workflow.damageRolls.map(roll => roll.constructor.fromData(roll.toJSON()))] : await Promise.all(workflow.damageRolls.map(roll => roll.reroll({maximize: true})));
    await workflow.setDamageRolls(rolls);
    if (config.mode !== 'double') workflowUtils.setWorkflowProperty(workflow, 'maximizeDamage', true);
    const activity = config.rollActivity ? effectUtils.getOriginActivitySync(effect)?.item?.system.activities.get(config.rollActivity) : undefined;
    if (activity) await workflowUtils.completeActivityUse(activity, []);
    if (config.consume) await documentUtils.deleteDocument(effect);
}
async function damage({document: effect, workflow}) {
    if (!workflow.damageRolls?.length) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'modifyNextDamage', configKeys);
    if (config.incoming || !matches(config, workflow)) return;
    await apply(effect, workflow, config);
}
async function incoming({document: effect, workflow}) {
    if (!workflow.damageRolls?.length) return;
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'modifyNextDamage', configKeys);
    if (!config.incoming || !matches(config, workflow)) return;
    if (!workflow.hitTargets.documents.some(token => token.actor === effect.parent)) return;
    await apply(effect, workflow, config);
}
async function finished({document: effect, workflow}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'modifyNextDamage', configKeys);
    if (config.incoming || config.consumeOn !== 'attack' || !workflow.activity?.hasAttack || !matches(config, workflow)) return;
    if (!effect.parent?.effects.get(effect.id)) return;
    await documentUtils.deleteDocument(effect);
}
/**
 * Maximizes or doubles the next damage roll made by the actor that has this effect, or the next damage roll that hits
 * it.
 */
export const modifyNextDamage = {
    rules: 'all',
    version: '2.1.11',
    category: 'damage',
    generic: true,
    documents: ['activeeffect'],
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 450
        },
        {
            pass: 'targetDamageRollComplete',
            macro: incoming,
            priority: 450
        },
        {
            pass: 'actorRollFinished',
            macro: finished,
            priority: 450
        }
    ],
    genericConfig: {
        mode: {
            default: 'maximize',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Mode.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Mode.Hint',
            options: [
                {value: 'maximize', label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Maximize'},
                {value: 'double', label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Double'}
            ]
        },
        itemTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.ItemTypes.Hint',
            get options() { return constants.usableItemTypes; }
        },
        maxSpellLevel: {
            default: 9,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSpellLevel',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.MaxSpellLevel.Hint'
        },
        weaponTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.WeaponTypes.Hint',
            get options() { return constants.weaponTypes; }
        },
        attackType: attackTypeConfig,
        requireHit: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.RequireHit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.RequireHit.Hint'
        },
        incoming: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Incoming.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Incoming.Hint'
        },
        consume: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Consume.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.Consume.Hint'
        },
        consumeOn: {
            default: 'roll',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.ConsumeOn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.ConsumeOn.Hint',
            options: [
                {value: 'roll', label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.ConsumeOnRoll'},
                {value: 'attack', label: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.ConsumeOnAttack'}
            ]
        },
        rollActivity: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ModifyNextDamage.RollActivity.Hint'
        }
    }
};
const configKeys = Object.keys(modifyNextDamage.genericConfig);
