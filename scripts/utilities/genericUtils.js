function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function translate(key) {
    return game.i18n.localize(key);
}
function setProperty(object, key, value) {
    return foundry.utils.setProperty(object, key, value);
}
function duplicate(object) {
    return foundry.utils.duplicate(object);
}
export let helpers = {
    sleep,
    translate,
    setProperty,
    duplicate
};