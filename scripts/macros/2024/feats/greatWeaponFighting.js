import {actorUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils} from '../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.damageRolls || !workflow.actor || workflow.attackMode !== 'twoHanded' || !constants.meleeWeaponTypes.includes(workflow.item?.system?.type?.value)) return;
    const requiredProperties = new Set(['ver', 'two']);
    if (!workflow.item.system.properties.intersection(requiredProperties).size) return;
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        let newFormula = '';
        for (let i of roll.terms) {
            if (i.isDeterministic) {
                newFormula += i.expression;
            } else if (i.expression.toLowerCase().includes('min3')) {
                newFormula += i.formula;
            } else if (i.flavor) {
                newFormula += i.expression + 'min3[' + i.flavor + ']';
            } else {
                newFormula += i.expression + 'min3';
            }
        }
        return await rollUtils.damageRoll(newFormula, workflow.item, roll.options);
    }));
    await workflow.setDamageRolls(damageRolls);
}

export let greatWeaponFighting = {
    name: 'Great Weapon Fighting',
    version: '1.2.36',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 320
            }
        ]
    }
};