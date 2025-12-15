import {constants, itemUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function skill({trigger: {entity: item, skillId, config, actor}}) {
    let skills = itemUtils.getConfig(item, 'skills');
    if (!skills.length) return;
    if (!skills.includes(skillId)) return;
    let replacementAbilities = itemUtils.getConfig(item, 'replacementAbilities');
    let defaultAbility = CONFIG.DND5E.skills[skillId].ability;
    let defaultScore = actor.system.abilities[defaultAbility].mod + rollUtils.rollDiceSync(String(actor.system.abilities[defaultAbility].checkBonus), {entity: actor, maximize: true}).total;
    let bestAbility = defaultAbility;
    let bestScore = defaultScore;
    for (let ability of replacementAbilities) {
        let score = actor.system.abilities[ability].mod + rollUtils.rollDiceSync(String(actor.system.abilities[ability].checkBonus), {entity: actor, maximize: true}).total;
        if (score > bestScore) {
            bestAbility = ability;
            bestScore = score;
        }
    }
    if (bestAbility === defaultAbility) return;
    await workflowUtils.syntheticItemRoll(item, []);
    config.ability = bestAbility;
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
            value: 'replacementAbilities',
            label: 'CHRISPREMADES.Macros.PrimalKnowledge.ReplacementAbilities',
            type: 'select-many',
            default: ['wis', 'int'],
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
    //ddbi: {
    //    removeChoices: [
    //        'Forest Sage'
    //    ]
    //}
};