import * as macros from '../../macros.js';
import {constants} from '../constants.js';
import {errors} from '../errors.js';
import {genericUtils} from './genericUtils.js';
import {itemUtils} from './itemUtils.js';
async function getCPRAutomation(item) {
    let keys = [];
    switch (item.type) {
        case 'spell':
            keys.push(constants.packs.spells);
            break;
        case 'weapon':
        case 'equipment':
        case 'consumable':
        case 'tool':
        case 'backpack':
        case 'loot':
            keys.push(constants.packs.items);
            break;
        case 'feat':
    }
    let identifier = itemUtils.getIdentifer(item);
    let name = macros[identifier]?.name ?? item.name;
    let folderId;
    let type = item.actor?.type ?? 'character';
    if (type === 'npc' && item.type != 'spell') {
        let name = item.actor.prototypeToken.name;
        let pack = game.packs.get(keys[0]);
        if (!pack) {
            errors.missingPack();
            return;
        }
        folderId = pack.folders.find(i => i.name === name)?.id;
        if (!folderId) return;
    }
    for (let key of keys) {
        let found = await getItemFromCompendium(key, name, {ignoreNotFound: true, folderId: folderId});
        if (found) return found;
    }
}
async function getGPSAutomation(item) {

}
async function getMISCAutomation(item) {

}
async function getAllAutomations(item) {
    let setting = genericUtils.getCPRSetting('additionalCompendiums');
    let items = [];
    await Promise.all(Object.entries(setting).map(async i => {
        let found;
        let source;
        switch (i[0]) {
            default: found = await getItemFromCompendium(i[0], item.name, {ignoreNotFound: true}); source = i[0]; break;
            case 'CPR': found = await getCPRAutomation(item); source = 'CPR'; break;
            case 'GPS': found = await getGPSAutomation(item); source = 'GPS'; break;
            case 'MISC': found = await getMISCAutomation(item); source = 'MISC'; break;
        }
        if (found) items.push({document: found, priority: i[1], source: source});
    }));
    return items.sort((a, b) => a.priority - b.priority);
}
async function getPreferredAutomation(item) {
    let items = await getAllAutomations(item);
    return items.length ? items[0].document : undefined;
}
async function getItemFromCompendium(key, name, {ignoreNotFound, folderId} = {}) {
    let pack = game.packs.get(key);
    if (!pack) {
        if (!ignoreNotFound) errors.missingPack();
        return undefined;
    }
    let packIndex = await pack.getIndex({'fields': ['name', 'type', 'folder']});
    let match = packIndex.find(item => item.name === name && (!folderId || (folderId && item.folder === folderId)));
    if (match) {
        return await pack.getDocument(match._id);
    } else {
        if (!ignoreNotFound) errors.missingPackItem();
        return undefined;
    }
}
export let compendiumUtils = {
    getCPRAutomation,
    getGPSAutomation,
    getMISCAutomation,
    getAllAutomations,
    getItemFromCompendium,
    getPreferredAutomation
};