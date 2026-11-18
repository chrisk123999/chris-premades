import {automationUtils, constants, workflowUtils} from '../../../proxy.mjs';
function score(actor, ability) {
    const data = actor.system.abilities[ability];
    return data ? data.mod + data.check.bonus : -Infinity;
}
async function skill({document: item, actor, config}) {
    const {skills, replacementAbilities} = automationUtils.getConfigValues(item, ['skills', 'replacementAbilities']);
    if (!skills.includes(config.skill)) return;
    const original = config.ability ?? actor.system.skills[config.skill]?.ability;
    const best = replacementAbilities.reduce((current, ability) => score(actor, ability) > score(actor, current) ? ability : current, original);
    if (best === original) return;
    await workflowUtils.completeItemUse(item);
    config.ability = best;
}
export const forestSage = {
    name: 'Forest Sage',
    version: '2.1.9',
    rules: '2014',
    skill: [
        {
            pass: 'actorSituational',
            macro: skill,
            priority: 200
        }
    ],
    config: {
        skills: {
            default: ['ani', 'arc', 'nat', 'sur'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Skills',
            get options() { return constants.skillOptions; }
        },
        replacementAbilities: {
            default: ['int', 'wis'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Abilities',
            get options() { return constants.abilityOptions; }
        }
    }
};
