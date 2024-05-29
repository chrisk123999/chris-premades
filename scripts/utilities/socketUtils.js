function gmID() {
    return game.settings.get('chris-premades', 'gmID');
}
function isTheGM() {
    return gmID() === game.user.id;
}
function hasPermission(entity, userId) {
    let user = game.users.get(userId);
    if (!user) return false;
    return entity.testUserPermission(user, 'OWNER');
}
export let socketUtils = {
    gmID,
    isTheGM,
    hasPermission
};