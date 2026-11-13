import {automationUtils, DamageBonus, documentUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document: item, workflow}) {
    if (!workflow.hitTargets.count) return;
    const config = automationUtils.getConfigValues(item, Object.keys(dueling.config));
    const exception = config.exceptions.includes(documentUtils.getIdentifier(workflow.item));
    if (!exception && (
        workflow.attackMode === 'twoHanded' ||
        !workflowUtils.isAttackType(workflow, 'meleeWeaponAttack') ||
        ['natural', 'unarmed'].includes(workflow.item.system?.type.value)
    )) return;
    if (workflow.actor.itemTypes.weapon.filter(i => i.system.equipped && ['natural', 'unarmed'].includes(i.system.type?.value)).length > 1) return;
    return new DamageBonus(item, {formula: config.formula || '2', optional: false});
}
export const dueling = {
    name: 'Dueling',
    rules: 'all',
    version: '2.0.3',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            phase: 'postResult',
            macro: damage,
            priority: 200
        }
    ],
    config: {
        formula: {
            default: '2',
            type: 'formula',
            label: 'CHRISPREMADES.Config.DamageBonus',
            category: 'behavior'
        },
        exceptions: {
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.All.Dueling',
            category: 'behavior'
        }
    }
};
