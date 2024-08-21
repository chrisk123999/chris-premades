import {gambitPremades} from '../../integrations/gambitsPremades.js';
import {miscPremades} from '../../integrations/miscPremades.js';
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
            keys.push(constants.packs.classFeatures);
            keys.push(constants.packs.actions);
    }
    if (!keys.length) return;
    let identifier = genericUtils.getIdentifier(item);
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
    let found;
    switch(item.type) {
        case 'spell': found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'spell'); break;
        case 'weapon':
        case 'equipment':
        case 'consumable':
        case 'tool':
        case 'backpack':
        case 'loot':
            found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'item'); break;
        case 'feat': found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'feat'); break;
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getMISCAutomation(item) {
    let found;
    switch(item.type) {
        case 'spell': found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'spell'); break;
        case 'weapon':
        case 'equipment':
        case 'consumable':
        case 'tool':
        case 'backpack':
        case 'loot':
            found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'item'); break;
        case 'feat': found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'feat'); break;
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getAllAutomations(item) {
    let setting = genericUtils.getCPRSetting('additionalCompendiums');
    let items = [];
    await Promise.all(Object.entries(setting).map(async i => {
        let found;
        let source;
        let version;
        switch (i[0]) {
            default:
                found = await getItemFromCompendium(i[0], item.name, {ignoreNotFound: true, matchType: constants.itemTypes.includes(item.type) ? 'item' : item.type});
                source = i[0];
                break;
            case 'chris-premades':
                found = await getCPRAutomation(item);
                source = 'chris-premades';
                if (found) version = itemUtils.getVersion(found);
                break;
            case 'gambits-premades': 
                found = await getGPSAutomation(item);
                source = 'gambits-premades';
                version = gambitPremades.gambitItems.find(i => i.name === item.name)?.version;
                break;
            case 'midi-item-showcase-community':
                found = await getMISCAutomation(item);
                source = 'midi-item-showcase-community';
                version = miscPremades.miscItems.find(i => i.name === item.name)?.version;
                break;
        }
        if (found) items.push({document: found, priority: i[1], source: source, version: version});
    }));
    return items.sort((a, b) => a.priority - b.priority);
}
async function getPreferredAutomation(item) {
    let items = await getAllAutomations(item);
    return items.length ? items[0].document : undefined;
}
async function getItemFromCompendium(key, name, {ignoreNotFound, folderId, object = false, getDescription, translate, identifier, flatAttack, flatDC, castDataWorkflow, matchType} = {}) {
    let pack = game.packs.get(key);
    if (!pack) {
        if (!ignoreNotFound) errors.missingPack();
        return undefined;
    }
    let packIndex = await pack.getIndex({'fields': ['name', 'type', 'folder']});
    let match = packIndex.find(item => item.name === name && (!folderId || (folderId && item.folder === folderId)) && (!matchType || (item.type === matchType)));
    if (match) {
        let document = await pack.getDocument(match._id);
        if (object) {
            let documentData = document.toObject();
            if (getDescription) documentData.system.description.value = itemUtils.getItemDescription(document.name);
            if (translate) {
                documentData.name = genericUtils.translate(translate);
                documentData.effects?.forEach(effectData => {
                    effectData.name = genericUtils.translate(translate);
                });
            }
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
        if (!ignoreNotFound) errors.missingPackItem(key, name);
        return undefined;
    }
}
async function getActorFromCompendium(key, name, {ignoreNotFound, folderId, object = false, translate, identifier} = {}) {
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
        if (!ignoreNotFound) errors.missingPackItem(key, name);
        return undefined;
    }
}
async function getFilteredDocumentsFromCompendium(key, {maxCR, actorTypes, creatureTypes, creatureSubtypes}={}) {
    let pack = game.packs.get(key);
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'img', 'system.details.cr', 'system.details.type']});
    let filteredIndex = packIndex.filter(i => 
        (!actorTypes?.length || actorTypes.includes(i.type)) && 
        (!maxCR || i.system?.details?.cr < maxCR) && 
        (!creatureTypes?.length || creatureTypes.includes(i.system?.details?.type?.value)) &&
        (!creatureSubtypes?.length || creatureSubtypes.includes(i.system?.details?.type?.subtype?.toLowerCase()))
    );
    filteredIndex = game.dnd5e.moduleArt.apply(filteredIndex);
    filteredIndex = filteredIndex.map(i => foundry.utils.mergeObject(i, {img: 'icons/svg/mystery-man.svg'}, {overwrite: !i.img}));
    return filteredIndex;
}
async function getAppliedOrPreferredAutomation(item) {
    let source = itemUtils.getSource(item);
    if (source) {
        switch (source) {
            case 'chris-premades': {
                return await getCPRAutomation(item);
            }
            case 'gambits-premades':{
                return await getGPSAutomation(item);
            }
            case 'midi-item-showcase-community': {
                return await getMISCAutomation(item);
            }
            default: {
                let document = await getItemFromCompendium(source, item.name, {ignoreNotFound: true});
                if (!document) document = await getPreferredAutomation(item);
                return document;
            }
        }
    } else {
        return await getPreferredAutomation(item);
    }
}
export let compendiumUtils = {
    getCPRAutomation,
    getGPSAutomation,
    getMISCAutomation,
    getAllAutomations,
    getItemFromCompendium,
    getPreferredAutomation,
    getActorFromCompendium,
    getFilteredDocumentsFromCompendium,
    getAppliedOrPreferredAutomation
};