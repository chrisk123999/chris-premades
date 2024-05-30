import {errors} from '../events/errors.js';
import {socket} from '../sockets.js';
import {actorUtils} from './actorUtils.js';
import {effectUtils} from './effectUtils.js';
import {genericUtils} from './genericUtils.js';
import {socketUtils} from './socketUtils.js';
function getSaveDC(item) {
    return item.getSaveDC();
}
async function createItems(actor, updates, {favorite, section, parentEntity, identifier}) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (section) updates.forEach(i => genericUtils.setProperty(i, 'flags.tidy5e-sheet.section', section));
    if (identifier) updates.forEach(i => genericUtils.setProperty(i, 'flags.chris-premades.identifier', identifier));
    let items;
    if (hasPermission) {
        items = await actor.createEmbeddedDocuments('Item', updates);
    } else {
        items = await socket.createEmbeddedDocuments(actor.uuid, 'Item', updates);
    }
    if (favorite) await actorUtils.addFavorites(actor, items);
    if (parentEntity) await effectUtils.addDependents(parentEntity, items);
}
async function getItemFromCompendium(key, name, {folderId, ignoreMissing, getDescription, translate}) {
    let pack = game.packs.get(key);
    if (!pack) {
        errors.missingPack();
        return false;
    }
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'folder']});
    let match = packIndex.find(item => item.name === name && (!folderId || (folderId && item.folder === folderId)));
    if (match) {
        let itemData = await pack.getDocument(match._id);
        delete itemData._id;
        if (getDescription) itemData.system.description.value = getItemDescription(name);
        if (translate) itemData.name = genericUtils.translate('CHRISPREMADES.item.' + translate);
        return itemData;
    } else {
        if (!ignoreMissing) errors.missingPackItem();
        return undefined;
    }
}
function getItemDescription(name) {
    let journal = game.journal.getName('CPR - Descriptions');
    if (!journal) {
        ui.notifications.warn(genericUtils.translate('CHRISPREMADES.error.missingDescriptionJournal'));
        return '';
    }
    let page = journal.pages.getName(name);
    if (!page) {
        ui.notifications.warn(genericUtils.translate('CHRISPREMADES.error.missingDescriptionPage'));
        return '';
    }
    return page.text.content;
}
export let itemUtils = {
    getSaveDC,
    createItems,
    getItemFromCompendium,
    getItemDescription
};