import {automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, rollUtils} from '../../proxy.mjs';
function leaves(choices) {
    return Object.entries(choices).flatMap(([key, value]) => value.children ? leaves(value.children) : [key]);
}
async function use({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'languageChoice', configKeys);
    const actor = workflow.actor;
    const identifier = 'languageChoice-' + activity.item.id;
    const effect = actor.effects.find(effect => documentUtils.getIdentifier(effect) === identifier);
    const previous = config.replace ? effect?.system.changes.map(change => change.value) ?? [] : [];
    const known = Array.from(actor.system.traits.languages.value).filter(language => !previous.includes(language));
    const count = (await rollUtils.rollDice(config.count || '1', {document: activity})).total;
    const fields = leaves(await dnd5e.documents.Trait.choices('languages')).filter(language => language !== 'ALL' && !known.includes(language)).map(language => ({
        label: dnd5e.documents.Trait.keyLabel(language, {trait: 'languages'}),
        name: language,
        options: {isChecked: previous.includes(language)}
    })).sort((a, b) => a.label.localeCompare(b.label));
    const selection = await dialogUtils.runDialog(game.user.id, activity.item.name, 'CHRISPREMADES.Macros.Generic.LanguageChoice.Select', [['checkbox', fields, {totalMax: count, displayAsRows: true}]], 'okCancel');
    if (!selection?.buttons) return;
    const languages = fields.map(field => field.name).filter(name => selection[name]);
    const limit = config.replaceLimit === '' ? Infinity : (await rollUtils.rollDice(config.replaceLimit, {document: activity})).total;
    if (previous.filter(language => !languages.includes(language)).length > limit) return genericUtils.notify('CHRISPREMADES.Macros.Generic.LanguageChoice.TooMany', {type: 'warn', format: {count: limit}});
    if (effect && config.replace) await documentUtils.deleteDocument(effect);
    if (!languages.length) return;
    await effectUtils.createEffects(actor, [{
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.item.uuid,
        flags: {cat: {identifier}},
        system: {changes: languages.map(value => ({key: 'system.traits.languages.value', type: 'add', value, priority: 20}))}
    }]);
}
/**
 * Prompts for languages the actor doesn't know and grants the chosen ones with an effect on the actor.
 */
export const languageChoice = {
    rules: 'all',
    version: '2.1.10',
    category: 'mechanics',
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
        count: {
            default: '1',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.LanguageChoice.Count.Label',
            hint: 'CHRISPREMADES.Macros.Generic.LanguageChoice.Count.Hint'
        },
        replace: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.LanguageChoice.Replace.Label',
            hint: 'CHRISPREMADES.Macros.Generic.LanguageChoice.Replace.Hint'
        },
        replaceLimit: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.LanguageChoice.ReplaceLimit.Label',
            hint: 'CHRISPREMADES.Macros.Generic.LanguageChoice.ReplaceLimit.Hint'
        }
    }
};
const configKeys = Object.keys(languageChoice.genericConfig);
