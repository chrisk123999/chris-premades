import * as macros from '../../macros.js';
import {socket} from '../sockets.js';
import {actorUtils, effectUtils, genericUtils, socketUtils, errors} from '../../utils.js';
function getSaveDC(item) {
    if (item.hasSave) return item.getSaveDC();
    let spellDC;
    let scaling = item.system?.save?.scaling;
    if (scaling === 'spell') {
        spellDC = item.actor?.system?.attributes?.spelldc;
    } else if (scaling !== 'flat') {
        spellDC = item.actor?.system?.abilities?.[scaling]?.dc;
    } else {
        spellDC = item.system?.save?.dc;
    }
    return spellDC ?? 10;
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
    syntheticItem
};