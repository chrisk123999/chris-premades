import {constants, itemUtils, rollUtils} from '../../../../utils.js';
async function ability({trigger: {entity: item, actor, roll, checkId, saveId}}) {
    let ability = itemUtils.getConfig(item, 'ability');
    let testAbility = roll.data.abilityId ?? checkId ?? saveId;
    if (testAbility != ability) return;
    let formula = 'max(' + roll.formula + ', ' + actor.system.abilities[ability].value + ')';
    let newRoll = await new Roll(formula, actor.getRollData(), roll.options).evaluate();
    return newRoll;
}
export let indomitableMight = {
    name: 'Indomitable Might',
    version: '1.1.22',
    rules: 'modern',
    check: [
        {
            pass: 'bonus',
            macro: ability,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'bonus',
            macro: ability,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: ability,
            priority: 50
        }
    ],
    config: [
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Abilities',
            type: 'select',
            default: 'str',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};