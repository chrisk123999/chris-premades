import {automationUtils, constants, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document: item, workflow}) {
    if (!workflow.damageRolls || !workflow.actor || workflow.attackMode !== 'twoHanded' || !workflowUtils.isAttackType(workflow, 'meleeWeaponAttack')) return;
    const config = automationUtils.getConfigValues(item, Object.keys(greatWeaponFighting.config));
    if (!workflow.item.system.properties.intersection(new Set(config.properties)).size) return;
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        let newFormula = '';
        for (let i of roll.terms) {
            if (i.isDeterministic) {
                newFormula += i.expression;
            } else if (i.expression.toLowerCase().includes(config.modifier)) {
                newFormula += i.formula;
            } else if (i.flavor) {
                newFormula += i.expression + config.modifier + '[' + i.flavor + ']';
            } else {
                newFormula += i.expression + config.modifier;
            }
        }
        return await rollUtils.damageRoll(newFormula, workflow.activity, roll.options);
    }));
    await workflow.setDamageRolls(damageRolls);
}
export const greatWeaponFighting = {
    name: 'Great Weapon Fighting',
    rules: 'all',
    version: '2.0.3',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 350
        }
    ],
    config: {
        modifier: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.DamageModifier',
            category: 'behavior'
        },
        properties: {
            default: ['ver', 'two'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.WeaponProperties',
            category: 'behavior',
            get options() { return constants.itemProperties(); }
        }
    }
};
