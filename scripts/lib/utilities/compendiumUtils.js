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
            case 'chris-premades': found = await getCPRAutomation(item); source = 'chris-premades'; break;
            case 'gambit-premades': found = await getGPSAutomation(item); source = 'gambit-premades'; break;
            case 'midi-item-community-showcase': found = await getMISCAutomation(item); source = 'midi-item-community-showcase'; break;
        }
        if (found) items.push({document: found, priority: i[1], source: source});
    }));
    return items.sort((a, b) => a.priority - b.priority);
}
async function getPreferredAutomation(item) {
    let items = await getAllAutomations(item);
    return items.length ? items[0].document : undefined;
}
async function getItemFromCompendium(key, name, {ignoreNotFound, folderId, object = false, getDescription, translate, identifier, flatAttack, flatDC, castDataWorkflow} = {}) {
    let pack = game.packs.get(key);
    if (!pack) {
        if (!ignoreNotFound) errors.missingPack();
        return undefined;
    }
    let packIndex = await pack.getIndex({'fields': ['name', 'type', 'folder']});
    let match = packIndex.find(item => item.name === name && (!folderId || (folderId && item.folder === folderId)));
    if (match) {
        let document = await pack.getDocument(match._id);
        if (object) {
            let documentData = document.toObject();
            if (getDescription) documentData.system.description.value = itemUtils.getItemDescription(document.name);
            if (translate) documentData.name = genericUtils.translate(translate);
            if (identifier) genericUtils.setProperty(documentData, 'flags.chris-premades.info.identifier', identifier);
            if (flatAttack) genericUtils.setProperty(documentData, 'system.attack', {bonus: flatAttack, flat: true});
            if (flatDC) genericUtils.setProperty(documentData, 'system.save', {ability: documentData.system.save.ability, dc: flatDC, scaling: 'flat'});
            if (castDataWorkflow) {
                genericUtils.setProperty(documentData, 'flags.chris-premades.castData', castDataWorkflow.castData);
                genericUtils.setProperty(documentData, 'flags.chris-premades.castData.school', castDataWorkflow.item.system.school);
            }
            return documentData;
        } else {
            return document;
        }
    } else {
        if (!ignoreNotFound) errors.missingPackItem();
        return undefined;
    }
}
async function getActorFromCompendium(key, name, {ignoreNotFound, folderId, object = false, translate, identifier}) {
    let pack = game.packs.get(key);
    if (!pack) {
        if (!ignoreNotFound) errors.missingPack();
        return undefined;
    }
    let packIndex = await pack.getIndex({'fields': ['name', 'type', 'folder']});
    let match = packIndex.find(item => item.name === name && (!folderId || (folderId && item.folder === folderId)));
    if (match) {
        let document = await pack.getDocument(match._id);
        if (object) {
            let documentData = document.toObject();
            if (translate) documentData.name = genericUtils.translate(translate);
            if (identifier) genericUtils.setProperty(documentData, 'flags.chris-premades.info.identifier', identifier);
            return documentData;
        } else {
            return document;
        }
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
    getPreferredAutomation,
    getActorFromCompendium
};