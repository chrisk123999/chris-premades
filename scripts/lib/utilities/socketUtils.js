import {socket} from '../sockets.js';
import {genericUtils} from './genericUtils.js';
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
function firstOwner(document, useId) {
    if (!document) return;
    let corrected = document instanceof TokenDocument ? document.actor : document instanceof Token ? document.document.actor : document;
    let permissions = genericUtils.getProperty(corrected ?? {}, 'ownership') ?? {};
    let playerOwners = Object.entries(permissions).filter(([id, level]) => !game.users.get(id)?.isGM && game.users.get(id)?.active && level === 3).map(([id]) => id);
    if (playerOwners.length > 0) return useId ? playerOwners[0] : game.users.get(playerOwners[0]);
    return useId ? gmID() : game.users.get(gmID());
}
async function remoteRollItem(item, config, options, userId) {
    if (game.user.id === userId) return await MidiQOL.completeItemUse(item, config, options);
    return await socket.executeAsUser('rollItem', userId, item.uuid, config, options);
}
export let socketUtils = {
    gmID,
    isTheGM,
    hasPermission,
    firstOwner,
    remoteRollItem
};