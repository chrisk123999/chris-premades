import {socket} from '../sockets.js';
import {socketUtils} from './socketUtils.js';
function getEffects(actor) {
    return Array.from(actor.allApplicableEffects());
}
async function addFavorites(actor, items) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        for (let i of items) await actor.system.addFavorite(i);
    } else {
        await socket.executeAsGM('addFavorites', actor.uuid, items.map(i => i.uuid));
    }
}
export let actorUtils = {
    getEffects,
    addFavorites
};