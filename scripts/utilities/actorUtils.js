function getEffects(actor) {
    return Array.from(actor.allApplicableEffects());
}
export let actorUtil = {
    getEffects
};