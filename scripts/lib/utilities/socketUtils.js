import {socket, sockets} from '../sockets.js';
import {genericUtils} from '../../utils.js';
function gmID() {
    let gmID = game.settings.get('chris-premades', 'gmID');
    let preferredGMId = game.settings.get('midi-qol', 'PreferredGM');  
    if (preferredGMId !== '') {
        let preferredGM = game.users.get(preferredGMId);
        if (preferredGM?.active) gmID = preferredGM.id;
    }
    return gmID;
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
    document = document instanceof TokenDocument ? document.actor : document instanceof foundry.canvas.placeables.Token ? document.document.actor : document;
    let permissions = genericUtils.getProperty(document ?? {}, 'ownership') ?? {};
    let playerOwners = Object.entries(permissions).filter(([id, level]) => !game.users.get(id)?.isGM && game.users.get(id)?.active && level === 3).map(([id]) => id);
    if (playerOwners.length > 0) {
        let playerId = document instanceof Actor.implementation ? 
            playerOwners.find(id => game.users.get(id)?.character?.uuid === document.uuid) ?? playerOwners[0] : 
            playerOwners[0];
        return useId ? playerId : game.users.get(playerId);
    }
    return useId ? gmID() : game.users.get(gmID());
}
async function remoteRollItem(item, config, options, userId) {
    if (game.user.id === userId) return await MidiQOL.completeItemUse(item, config, options);
    return await socket.executeAsUser(sockets.rollItem.name, userId, item.uuid, config, options);
}
export let socketUtils = {
    gmID,
    isTheGM,
    hasPermission,
    firstOwner,
    remoteRollItem
};