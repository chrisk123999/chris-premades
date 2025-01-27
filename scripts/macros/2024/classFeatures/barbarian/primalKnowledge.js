import {constants, effectUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function skill({trigger: {entity: item, skillId, config, actor}}) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'rage');
    if (!effect) return;
    let skills = itemUtils.getConfig(item, 'skills');
    if (!skills.length) return;
    if (!skills.includes(skillId)) return;
    let blockingConditions = itemUtils.getConfig(item, 'blockingConditions');
    if (actor.statuses.some(i => blockingConditions.includes(i))) return;
    let replacementAbility = itemUtils.getConfig(item, 'replacementAbility');
    let defaultAbility = CONFIG.DND5E.skills[skillId].ability;
    if (replacementAbility === defaultAbility) return;
    if ((actor.system.abilities[defaultAbility].mod + actor.system.abilities[defaultAbility].checkBonus) >= (actor.system.abilities[replacementAbility].mod + actor.system.abilities[replacementAbility].checkBonus)) return;
    await workflowUtils.completeItemUse(item);
    config.ability = replacementAbility;
}
export let primalKnowledge = {
    name: 'Primal Knowledge',
    version: '1.1.21',
    rules: 'modern',
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
            default: ['acr', 'itm', 'prc', 'ste', 'sur'],
            options: constants.skillOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'blockingConditions',
            label: 'CHRISPREMADES.Config.BlockingStatuses',
            type: 'select-many',
            default: [],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'replacementAbility',
            label: 'CHRISPREMADES.Macros.PrimalKnowledge.ReplacementAbility',
            type: 'select',
            default: 'str',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};