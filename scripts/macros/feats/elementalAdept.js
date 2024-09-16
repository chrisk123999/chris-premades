import {constants, itemUtils, rollUtils} from '../../utils.js';
async function damage({trigger, workflow}) {
    if (!workflow.damageRolls || !workflow.actor || !workflow.item) return;
    if (itemUtils.getConfig(trigger.entity, 'spellOnly')) {
        if (!(workflow.item.type === 'spell' || workflow.item.system.type.value === 'spellFeature')) return;
    }
    let validTypes = itemUtils.getConfig(trigger.entity, 'damageTypes');
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        if (!validTypes.includes(roll.options.type)) return roll;
        let newFormula = '';
        for (let i of roll.terms) {
            if (i.isDeterministic) {
                newFormula += i.expression;
            } else if (i.expression.toLowerCase().includes('min2')) {
                newFormula += i.formula;
            } else if (i.flavor) {
                newFormula += i.expression + 'min2[' + i.flavor + ']';
            } else {
                newFormula += i.expression + 'min2';
            }
        }
        return await rollUtils.damageRoll(newFormula, workflow.actor, roll.options);
    }));
    await workflow.setDamageRolls(damageRolls);
}
export let elementalAdeptA = {
    name: 'Elemental Adept (Acid)',
    version: '0.12.69',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 320
            }
        ]
    },
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'spellOnly',
            label: 'CHRISPREMADES.Macros.ElementalAdept.SpellOnly',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let elementalAdeptC = {
    name: 'Elemental Adept (Cold)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['cold'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'spellOnly',
            label: 'CHRISPREMADES.Macros.ElementalAdept.SpellOnly',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let elementalAdeptF = {
    name: 'Elemental Adept (Fire)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['fire'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'spellOnly',
            label: 'CHRISPREMADES.Macros.ElementalAdept.SpellOnly',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let elementalAdeptL = {
    name: 'Elemental Adept (Lightning)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['lightning'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'spellOnly',
            label: 'CHRISPREMADES.Macros.ElementalAdept.SpellOnly',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let elementalAdeptT = {
    name: 'Elemental Adept (Thunder)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'spellOnly',
            label: 'CHRISPREMADES.Macros.ElementalAdept.SpellOnly',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};