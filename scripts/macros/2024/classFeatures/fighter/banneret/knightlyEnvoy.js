import {constants, dialogUtils, effectUtils, genericUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'polyglotEffect');
    let previousLanguages = [];
    if (effect) {
        previousLanguages = effect.changes.filter(change => change.key === 'system.traits.languages.value').map(change => change.value);
    }
    let knownLanguages = Array.from(workflow.actor.system.traits.languages.value).filter(i => !previousLanguages.includes(i));
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectALanguage', constants.languageOptions().filter(i => !knownLanguages.includes(i.value)).map(i => [i.label, i.value]));
    if (!selection) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.changes[0].value = selection;
    if (effect) await genericUtils.remove(effect);
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let knightlyEnvoy = {
    name: 'Knightly Envoy',
    version: '1.3.164',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};