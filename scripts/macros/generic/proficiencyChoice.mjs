import {automationUtils, constants, dialogUtils, documentUtils, effectUtils} from '../../proxy.mjs';
function getChoices(actor, traits, proficiency, options) {
    return traits.flatMap(trait => options[trait].map(({value, label, image}) => ({
        id: trait + '.' + value,
        name: label,
        img: image,
        trait,
        key: value,
        current: actor.system[trait]?.[value]?.value ?? 0
    }))).filter(choice => {
        if (proficiency === 'lacking') return choice.current < 1;
        if (proficiency === 'proficient') return choice.current === 1;
        return true;
    });
}
async function use({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'proficiencyChoice', configKeys);
    if (!config.effect) return;
    const actors = workflow.targets.size ? Array.from(workflow.targets, token => token.actor).filter(Boolean) : [workflow.actor];
    const parentEntity = effectUtils.getConcentrationEffect(workflow.actor, activity.item);
    const options = {skills: constants.skillOptions, tools: constants.toolOptions};
    for (const actor of actors) {
        const choices = getChoices(actor, config.traits, config.proficiency, options);
        if (!choices.length) continue;
        const tags = Object.fromEntries(choices.filter(choice => choice.current).map(choice => [choice.id, CONFIG.DND5E.proficiencyLevels[choice.current]]));
        const selection = await dialogUtils.selectDocumentDialog(activity.item.name, _loc('CHRISPREMADES.Macros.Generic.ProficiencyChoice.Prompt', {name: actor.name}), choices, {combobox: true, sort: 'alphabetical', tags});
        if (!selection) continue;
        const effectData = documentUtils.getEffectData(activity, config.effect);
        effectData.system.changes = effectData.system.changes.map(change => ({...change, key: change.key.replaceAll('{key}', selection.id)}));
        if (selection.trait === 'tools' && !actor.system.tools?.[selection.key]) {
            effectData.system.changes.push({
                key: 'system.tools.' + selection.key + '.ability',
                value: CONFIG.DND5E.tools[selection.key].ability,
                priority: 20,
                type: 'override'
            });
        }
        await effectUtils.createEffects(actor, [effectData], {parentEntity});
    }
}
export const proficiencyChoice = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        effect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Effect',
            hint: 'CHRISPREMADES.Macros.Generic.ProficiencyChoice.EffectHint'
        },
        traits: {
            default: ['skills'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ProficiencyChoice.Traits',
            hint: 'CHRISPREMADES.Macros.Generic.ProficiencyChoice.TraitsHint',
            get options() { return [
                {value: 'skills', label: _loc('CHRISPREMADES.Config.Skills')},
                {value: 'tools', label: _loc('CHRISPREMADES.Config.Tools')}
            ]; }
        },
        proficiency: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ProficiencyChoice.Proficiency',
            hint: 'CHRISPREMADES.Macros.Generic.ProficiencyChoice.ProficiencyHint',
            get options() { return [
                {value: '', label: _loc('CHRISPREMADES.Config.All')},
                {value: 'lacking', label: _loc('DND5E.NotProficient')},
                {value: 'proficient', label: _loc('DND5E.Proficient')}
            ]; }
        }
    }
};
const configKeys = Object.keys(proficiencyChoice.genericConfig);
