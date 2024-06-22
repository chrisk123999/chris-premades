import {socket} from '../sockets.js';
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
function firstOwner(document) {
    if (!document) return undefined;
    let ownership = document.ownership ?? document.actor?.ownership;
    if (!ownership) return undefined;
    let owners = Object.entries(ownership).filter(([userId, ownershipLevel]) => ownershipLevel === 3).map(([userId, _]) => userId);
    let playerOwners = owners.filter(userId => !game.users.get(userId).isGM);
    return game.users.get(playerOwners[0] ?? owners[0]);
}
async function remoteRollItem(item, config, options, userId) {
    if (firstOwner(item.actor).id === userId) return await MidiQOL.completeItemUse(item, config, options);
    return await socket.executeAsUser('rollItem', userId, item.uuid, config, options);
}
export let socketUtils = {
    gmID,
    isTheGM,
    hasPermission,
    firstOwner,
    remoteRollItem
};