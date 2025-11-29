import {constants, itemUtils, workflowUtils} from '../../../utils.js';
async function skill({trigger: {entity: item, skillId, config, actor}}) {
    let skills = itemUtils.getConfig(item, 'skills');
    if (!skills.length) return;
    if (!skills.includes(skillId)) return;
    let replacementAbility = itemUtils.getConfig(item, 'replacementAbility');
    let defaultAbility = CONFIG.DND5E.skills[skillId].ability;
    if (replacementAbility === defaultAbility) return;
    if ((actor.system.abilities[defaultAbility].mod + actor.system.abilities[defaultAbility].checkBonus) >= (actor.system.abilities[replacementAbility].mod + actor.system.abilities[replacementAbility].checkBonus)) return;
    await workflowUtils.syntheticItemRoll(item, []);
    config.ability = replacementAbility;
}
export let forestSage = {
    name: 'Forest Sage',
    version: '1.3.116',
    rules: 'legacy',
    skill: [
        {
            pass: 'situational',
            macro: skill,
            priority: 50
        }
    ],
    config: [
        {
            value: 'skills',
            label: 'CHRISPREMADES.Config.Skills',
            type: 'select-many',
            default: ['ani', 'arc', 'nat', 'sur'],
            options: constants.skillOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'replacementAbility',
            label: 'CHRISPREMADES.Macros.PrimalKnowledge.ReplacementAbility',
            type: 'select',
            default: 'wis',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        removeChoices: [
            'Forest Sage'
        ]
    }
};