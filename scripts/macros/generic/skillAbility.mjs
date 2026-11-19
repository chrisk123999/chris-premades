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
 * Listed skill checks use whichever listed ability gives the higher modifier.
 * Bound on an item. Fires on `actorSituational`.
 *
 * Config:
 * - `skills`: skills whose ability can change.
 * - `abilities`: abilities the check can use instead.
 * - `useItem`: use the item when the ability changes, to show the swap in chat.
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
            get options() { return constants.skillOptions; }
        },
        abilities: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Abilities',
            get options() { return constants.abilityOptions; }
        },
        useItem: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SkillAbility.UseItem',
            hint: 'CHRISPREMADES.Macros.Generic.SkillAbility.UseItemHint'
        }
    }
};
const configKeys = Object.keys(skillAbility.genericConfig);
