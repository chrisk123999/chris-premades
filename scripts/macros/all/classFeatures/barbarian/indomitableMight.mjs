import {automationUtils, constants, rollUtils, workflowUtils} from '../../../../proxy.mjs';
async function ability({actor, config, document: item, roll}) {
    const ability = automationUtils.getConfigValue(item, 'ability');
    const rolled = roll.data.abilityId ?? config.ability;
    if (rolled !== ability) return;
    const min = actor.system.abilities[ability].value;
    if (roll.total >= min) return;
    await workflowUtils.completeItemUse(item);
    return rollUtils.setTotalWithBonus(roll, min);
}
export const indomitableMight = {
    name: 'Indomitable Might',
    version: '2.0.2',
    rules: 'all',
    check: [
        {
            pass: 'actorBonus',
            macro: ability,
            priority: 200
        }
    ],
    skill: [
        {
            pass: 'actorBonus',
            macro: ability,
            priority: 200
        }
    ],
    config: {
        ability: {
            default: 'str',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Ability',
            get options() { return constants.abilityOptions(); }
        }
    }
};
