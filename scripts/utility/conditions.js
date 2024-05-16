import {constants} from '../constants.js';
import {chris} from '../helperFunctions.js';
async function menu(effect) {
    let conditions = Object.values(CONFIG.DND5E.conditionTypes).map(i => i.label);
    let effectConditions = effect.flags['chris-premades']?.conditions ?? [];
    let inputs = conditions.map(i => (
        {
            'type': 'checkbox',
            'label': i,
            'options': effectConditions.includes(i)
        }
    ));
    let selection = await chris.menu('Effect Conditions', constants.okCancel, inputs, true);
    if (!selection.buttons) return;
    let flagData = [];
    for (let i = 0; selection.inputs.length > i; i++) {
        let data = selection.inputs[i];
        if (!data) continue;
        flagData.push(conditions[i]);
    }
    if (!flagData.length) return;
    await effect.setFlag('chris-premades', 'conditions', flagData);
}
async function created(effect, options, userId) {
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    for (let i of effectConditions) {
        let actorEffect = chris.findEffect(effect.parent, i);
        if (actorEffect) continue;
        await chris.addCondition(effect.parent, i);
    }
}
async function deleted(effect, options, userId) {
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    for (let i of effectConditions) {
        let otherEffect = chris.getEffects(effect.parent).find(j => j.flags['chris-premades']?.conditions?.includes(i));
        if (otherEffect) continue;
        let actorEffect = chris.findEffect(effect.parent, i);
        if (!actorEffect) continue;
        await chris.removeEffect(actorEffect);
    }
}
export let effectConditions = {
    'menu': menu,
    'created': created,
    'deleted': deleted
};