import {socket} from '../sockets.js';
import {actorUtils} from './actorUtils.js';
import {effectUtils} from './effectUtils.js';
import {helpers} from './genericUtils.js';
import {socketUtils} from './socketUtils.js';

function getSaveDC(item) {
    return item.getSaveDC();
}
async function createItems(actor, updates, {favorite, section, parentEntity}) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (section) {
        updates.forEach(i => {
            helpers.setProperty(i, 'flags.tidy5e-sheet.section', section);
        });
    }
    let items;
    if (hasPermission) {
        items = await actor.createEmbeddedDocuments('Item', updates);
    } else {
        items = await socket.createEmbeddedDocuments(actor.uuid, 'Item', updates);
    }
    if (favorite) await actorUtils.addFavorites(actor, items);
    if (parentEntity) await effectUtils.addDependents(parentEntity, items);
}
export let itemUtils = {
    getSaveDC,
    createItems
};