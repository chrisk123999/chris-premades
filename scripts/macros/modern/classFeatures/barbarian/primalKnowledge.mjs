import {automationUtils, constants, genericUtils} from '../../../../proxy.mjs';
import {swapSkillAbility} from '../../../generic/skillAbility.mjs';
import {cprUtils} from '../../../../module.mjs';
async function modifyRage({document: item, data: {effectData}}) {
    if (!effectData) return;
    genericUtils.setProperty(effectData, 'flags.chris-premades.primalKnowledge', item.uuid);
    return cprUtils.addEffectMacro(effectData, {
        macroIdentifier: 'primalKnowledgeEffect',
        rules: primalKnowledgeEffect.rules,
        type: 'skill'
    });
}
async function skill({actor, config, document: rageEffect}) {
    const item = await fromUuid(rageEffect?.flags['chris-premades']?.primalKnowledge);
    if (!item) return;
    const {ability, skills} = automationUtils.getConfigValues(item, ['ability', 'skills']);
    await swapSkillAbility({actor, config, item, skills, abilities: [ability]});
}
export const primalKnowldege = {
    name: 'Primal Knowledge',
    version: '2.1.9',
    rules: '2024',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: modifyRage,
            priority: 150
        }
    ],
    config: {
        ability: {
            default: 'str',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Ability',
            get options() { return constants.abilityOptions; }
        },
        skills: {
            default: ['acr', 'itm', 'prc', 'ste', 'sur'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            get options() { return constants.skillOptions; }
        }
    }
};
export const primalKnowledgeEffect = {
    name: primalKnowldege.name,
    version: primalKnowldege.version,
    rules: primalKnowldege.rules,
    skill: [
        {
            pass: 'actorSituational',
            macro: skill,
            priority: 200
        }
    ]
};
