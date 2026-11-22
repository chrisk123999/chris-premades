import {automationUtils, constants, workflowUtils} from '../../proxy.mjs';
function score(actor, ability) {
    const data = actor.system.abilities[ability];
    return data ? data.mod + data.check.bonus : -Infinity;
}
export async function swapSkillAbility({actor, config, item, skills, abilities}) {
    if (!skills.includes(config.skill)) return;
    const original = config.ability ?? actor.system.skills[config.skill]?.ability;
    const best = abilities.reduce((current, ability) => score(actor, ability) > score(actor, current) ? ability : current, original);
    if (best === original) return;
    if (item) await workflowUtils.completeItemUse(item);
    config.ability = best;
}
async function skill({document, actor, config}) {
    const {skills, abilities, useItem} = automationUtils.getGenericConfigValues(document, 'chris-premades', 'skillAbility', configKeys);
    await swapSkillAbility({actor, config, item: useItem ? document : undefined, skills, abilities});
}
/**
 * Checks with the selected skills use whichever selected ability gives the highest modifier, counting ability check
 * bonuses. The skill's normal ability is kept on a tie.
 */
export const skillAbility = {
    rules: 'all',
    version: '2.1.9',
    category: 'utility',
    generic: true,
    documents: ['item'],
    skill: [
        {
            pass: 'actorSituational',
            macro: skill,
            priority: 200
        }
    ],
    genericConfig: {
        skills: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            hint: 'CHRISPREMADES.Macros.Generic.SkillAbility.Skills.Hint',
            get options() { return constants.skillOptions; }
        },
        abilities: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Abilities',
            hint: 'CHRISPREMADES.Macros.Generic.SkillAbility.Abilities.Hint',
            get options() { return constants.abilityOptions; }
        },
        useItem: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SkillAbility.UseItem.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SkillAbility.UseItem.Hint'
        }
    }
};
const configKeys = Object.keys(skillAbility.genericConfig);
