import * as macros from '../../macros.js';
import {socket} from '../sockets.js';
import {actorUtils, effectUtils, genericUtils, socketUtils, errors} from '../../utils.js';
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
function isSpellFeature(item) {
    return item.system.type?.value === 'spellFeature';
}
function getConfig(item, key) {
    let flagValue = item.flags['chris-premades']?.config?.[key];
    if (flagValue) return flagValue;
    let identifier = getIdentifer(item);
    if (!identifier) return;
    let value = macros[identifier]?.config?.find(i => i.value === key)?.default;
    return value === '' ? false : value;
}
function getIdentifer(item) {
    return item.flags['chris-premades']?.info?.identifier;
}
function getItemByIdentifer(actor, identifier) {
    return actor.items.find(i => getIdentifer(i) === identifier);
}
function getVersion(item) {
    return item.flags['chris-premades']?.info?.version;
}
function getSource(item) {
    return item.flags['chris-premades']?.info?.source;
}
function isUpToDate(item) {
    let version = getVersion(item);
    let source = getSource(item);
    if (!version || !source) return -1;
    let sourceVersion;
    switch (source) {
        case 'gambit-premades':
            sourceVersion = 1;
            break;
        case 'midi-item-community-showcase':
            sourceVersion = 1;
            break;
        case 'chris-premades': {
            let identifier = getIdentifer(item);
            sourceVersion = macros[identifier].version;
            break;
        }
    }
    let compare = genericUtils.isNewerVersion(sourceVersion, version);
    return compare ? 0 : 1;
}
async function syntheticItem(itemData, actor) {
    let item = new CONFIG.Item.documentClass(itemData, {parent: actor});
    item.prepareData();
    item.prepareFinalAttributes();
    return item;
}
async function medkitItem(oldItem, newItem, {source, version, identifier} = {}) {
    let oldItemData = genericUtils.duplicate(oldItem.toObject());
    let newItemData = genericUtils.duplicate(newItem.toObject());
    let itemType = oldItem.type;
    newItemData.name = oldItemData.name;
    newItemData.system.description = oldItemData.system.description;
    newItemData.system.chatFlavor = oldItemData.system.chatFlavor;
    newItemData.system.uses = oldItemData.system.uses;
    if (itemType === 'spell') newItemData.system.preparation = oldItemData.system.preparation;
    if (itemType != 'spell' && itemType != 'feat') {
        newItemData.system.attunement = oldItemData.system.attunement;
        newItemData.system.equipped = oldItemData.system.equipped;
    }
    if (oldItemData.system.quantity) newItemData.system.quantity;
    let ccssSection = oldItemData.flags['custom-character-sheet-sections']?.sectionName;
    if (ccssSection) genericUtils.setProperty(newItemData, 'flags.custom-character-sheet-sections.sectionName', ccssSection);
    if (oldItemData.flags.ddbimporter) newItemData.flags.ddbimporter = oldItemData.flags.ddbimporter;
    if (oldItemData.flags['tidy5e-sheet']) newItemData.flags['tidy5e-sheet'] = oldItemData.flags['tidy5e-sheet'];
    if (source) genericUtils.setProperty(newItemData, 'flags.chris-premades.info.source', source);
    if (version) genericUtils.setProperty(newItemData, 'flags.chris-premades.info.version', version);
    if (identifier) genericUtils.setProperty(newItemData, 'flags.chris-premades.info.identifier', identifier);
    let config = oldItemData.flags['chris-premades']?.config;
    if (config) genericUtils.setProperty(newItemData, 'flags.chris-premades.config', config);
    if (CONFIG.DND5E.defaultArtwork.Item[itemType] != oldItemData.img) newItemData.img = oldItemData.img;
    if (oldItem.effects.size) await oldItem.deleteEmbeddedDocuments('ActiveEffect', oldItem.effects.map(i => i.id));
    await oldItem.update(newItemData);
}
export let itemUtils = {
    getSaveDC,
    createItems,
    getItemDescription,
    isSpellFeature,
    getConfig,
    getIdentifer,
    getItemByIdentifer,
    getVersion,
    getSource,
    isUpToDate,
    syntheticItem,
    medkitItem
};