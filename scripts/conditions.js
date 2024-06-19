import {actorUtils, effectUtils, socketUtils} from './utils.js';
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    let updates = [];
    await Promise.all(effectConditions.map(async i => {
        let cEffect = effectUtils.getEffectByStatusID(effect.parent, i);
        if (cEffect) return;
        let effectImplementation = await ActiveEffect.implementation.fromStatusEffect(i);
        if (!effectImplementation) return;
        let effectData = effectImplementation.toObject();
        updates.push(effectData);
    }));
    if (updates.length) await effect.parent.createEmbeddedDocuments('ActiveEffect', updates, {keepId: true});
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    let ids = [];
    effectConditions.forEach(i => {
        let otherEffect = actorUtils.getEffects(effect.parent).find(j => j.id != effect.id && j.flags['chris-premades']?.conditions?.includes(i));
        if (otherEffect) return;
        let cEffect = effectUtils.getEffectByStatusID(effect.parent, i);
        if (cEffect) ids.push(cEffect.id);
    });
    if (ids.length) await effect.parent.deleteEmbeddedDocuments('ActiveEffect', ids);
}
export let conditions = {
    createActiveEffect,
    deleteActiveEffect
};