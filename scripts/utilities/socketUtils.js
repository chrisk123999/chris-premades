function gmID() {
    return game.settings.get('chris-premades', gmID);
}
function isTheGM() {
    return gmID() === game.user.id;
}
export let socketUtils = {
    gmID,
    isTheGM
};