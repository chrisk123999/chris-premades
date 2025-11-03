import {actorUtils} from '../utils.js';
async function preRemove(effect, options, userId) {
    let circleCastUuid = effect.flags['chris-premades']?.circleCast?.concentration?.uuid;
    if (!circleCastUuid) return;
    let token = actorUtils.getFirstToken(effect.parent);
    if (!token) return;
    let otherToken = token.document.parent.tokens.find(t => {
        if (!t.actor) return;
        if (t.actor.uuid === effect.parent.uuid) return;
        return actorUtils.getEffects(t.actor).find(e => e.flags['chris-premades']?.circleCast?.concentration?.uuid === circleCastUuid);
    });
    if (!otherToken) return;
    effect.updateSource({'flags.dnd5e.dependents': []});
}
export let concentration = {
    preRemove
};