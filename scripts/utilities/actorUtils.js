function getEffects(actor) {
    return Array.from(actor.allApplicableEffects());
}
export let actorUtils = {
    getEffects
};