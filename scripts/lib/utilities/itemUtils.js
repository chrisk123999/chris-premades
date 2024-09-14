import * as macros from '../../macros.js';
import {socket} from '../sockets.js';
import {actorUtils, effectUtils, genericUtils, socketUtils, errors} from '../../utils.js';
import {gambitPremades} from '../../integrations/gambitsPremades.js';
import {miscPremades} from '../../integrations/miscPremades.js';
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
function getMod(item) {
    return item.system.save.scaling === 'spell' ? item.actor.system.abilities[item.actor.system.attributes.spellcasting].mod : item.actor.system.abilities[item.system.save.scaling].mod;
}
async function createItems(actor, updates, {favorite, section, parentEntity, identifier, castData} = {}) {
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (section) updates.forEach(i => genericUtils.setProperty(i, 'flags.tidy5e-sheet.section', section));
    if (identifier) updates.forEach(i => genericUtils.setProperty(i, 'flags.chris-premades.info.identifier', identifier));
    if (castData) updates.forEach(i => genericUtils.setProperty(i, 'flags.chris-premades.castData', castData));
    let items;
    if (hasPermission) {
        items = await actor.createEmbeddedDocuments('Item', updates);
    } else {
        items = await socket.createEmbeddedDocuments(actor.uuid, 'Item', updates);
    }
    if (favorite) await actorUtils.addFavorites(actor, items);
    if (parentEntity) await effectUtils.addDependent(parentEntity, items);
    return items;
}
function getItemDescription(name) {
    let journal = game.journal.getName('CPR - Descriptions');
    if (!journal) {
        genericUtils.notify('CHRISPREMADES.Error.MissingDescriptionJournal', 'warn');
        return '';
    }
    let page = journal.pages.getName(name);
    if (!page) {
        genericUtils.notify('CHRISPREMADES.Error.MissingDescriptionPage', 'warn');
        return '';
    }
    return page.text.content;
}
function isSpellFeature(item) {
    return item.system.type?.value === 'spellFeature';
}
function getConfig(item, key) {
    let flagValue = item.flags['chris-premades']?.config?.[key];
    if (flagValue !== undefined) return flagValue;
    let identifier = genericUtils.getIdentifier(item);
    if (!identifier) return;
    let value = macros[identifier]?.config?.find(i => i.value === key)?.default;
    return value === '' ? false : value;
}
async function setConfig(item, key, value) {
    return await genericUtils.setFlag(item, 'chris-premades', 'config.' + key, value);
}
function getItemByIdentifier(actor, identifier) {
    return actor.items.find(i => genericUtils.getIdentifier(i) === identifier);
}
function getAllItemsByIdentifier(actor, identifier) {
    return actor.items.filter(i => genericUtils.getIdentifier(i) === identifier);
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
    if (!version || !source) return (item.flags['chris-premades']?.config?.generic ? 2 : -1);
    let sourceVersion;
    switch (source) {
        case 'gambits-premades':
            sourceVersion = gambitPremades.gambitItems.find(i => i.name === item.name)?.version;
            break;
        case 'midi-item-showcase-community':
            sourceVersion = miscPremades.miscItems.find(i => i.name === item.name)?.version;
            break;
        case 'chris-premades': {
            let identifier = genericUtils.getIdentifier(item);
            sourceVersion = macros[identifier]?.version;
            break;
        }
    }
    if (!sourceVersion) return -1;
    let compare = genericUtils.isNewerVersion(sourceVersion, version);
    return compare ? 0 : 1;
}
async function syntheticItem(itemData, actor) {
    let item = new CONFIG.Item.documentClass(itemData, {parent: actor});
    item.prepareData();
    item.prepareFinalAttributes();
    item.applyActiveEffects();
    return item;
}
async function enchantItem(item, effectData, {effects = [], items = [], concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent}) {
    genericUtils.setProperty(effectData, 'flags.dnd5e.type', 'enchantment');
    genericUtils.setProperty(effectData, 'flags.dnd5e.enchantment', {
        level: {
            min: null,
            max: null
        },
        riders: {
            effect: effects,
            item: items
        }
    });
    return await effectUtils.createEffect(item, effectData, {concentrationItem, parentEntity, identifier, vae, interdependent, strictlyInterdependent});
}
function convertDuration(item) {
    return DAE.convertDuration(item.system.duration);
}
function getEquipmentState(item) {
    let currentlyEquipped = item.system.equipped;
    let currentlyAttuned = item.system.attuned;
    let attunement = item.system?.attunement;
    let validTypes = ['required', 'optional'];
    let requiresAttunement = validTypes.includes(attunement);
    return ((requiresAttunement && currentlyAttuned) || !requiresAttunement) && currentlyEquipped ? true : false;
}
function getToolProficiency(actor, tool) {
    let toolName = tool.system.type?.baseItem;
    if (!toolName) return 0;
    return actor.system.tools[toolName]?.value ?? 0;
}
function getSavedCastData(item) {
    return item.flags['chris-premades']?.castData;
}
function getGenericFeatureConfig(item, key) {
    return item.flags['chris-premades']?.config?.generic?.[key];
}
function getItemByGenericFeature(actor, key) {
    return actor.items.find(i => getGenericFeatureConfig(i, key));
}
export let itemUtils = {
    getSaveDC,
    createItems,
    getItemDescription,
    isSpellFeature,
    getConfig,
    getItemByIdentifier,
    getAllItemsByIdentifier,
    getVersion,
    getSource,
    isUpToDate,
    syntheticItem,
    enchantItem,
    getMod,
    convertDuration,
    setConfig,
    getEquipmentState,
    getToolProficiency,
    getSavedCastData,
    getGenericFeatureConfig,
    getItemByGenericFeature
};