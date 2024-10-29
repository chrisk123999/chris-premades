import {gambitPremades} from '../../integrations/gambitsPremades.js';
import {miscPremades} from '../../integrations/miscPremades.js';
import * as macros from '../../macros.js';
import {constants} from '../constants.js';
import {errors} from '../errors.js';
import {genericUtils} from './genericUtils.js';
import {itemUtils} from './itemUtils.js';
async function getCPRAutomation(item, {identifier} = {}) {
    let keys = [];
    let type = item.actor?.type ?? 'character';
    if (type === 'character' || item.type === 'spell') {
        keys = [];
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
                if (genericUtils.getCPRSetting('thirdParty')) keys.push(constants.packs.thirdPartyItems);
                break;
            case 'feat':
                if (item.system.type.value === 'race') {
                    keys.push(constants.packs.raceFeatures);
                    //if (genericUtils.getCPRSetting('thirdParty')) keys.push(constants.packs.thirdPartyRaceFeatures);
                } else {
                    keys.push(constants.packs.classFeatures);
                    if (genericUtils.getCPRSetting('thirdParty')) keys.push(constants.packs.thirdPartyClassFeatures);
                    keys.push(constants.packs.feats);
                    keys.push(constants.packs.actions);
                    keys.push(constants.packs.miscellaneous);
                }
                break;
        }
        if (!keys.length) return;
    } else if (type === 'npc') {
        keys.push(constants.packs.monsterFeatures);
    } else return;
    let itemIdentifier = genericUtils.getIdentifier(item);
    let name = macros[itemIdentifier]?.name ?? item.name;
    let folderId;
    if (type === 'npc' && item.type != 'spell') {
        let name = identifier ?? item.actor.prototypeToken.name;
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
async function getGPSAutomation(item, {identifier} = {}) {
    let found;
    let type = item.actor?.type ?? 'character';
    if (type === 'character' || item.type === 'spell') {
        switch(item.type) {
            case 'spell': found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'spell'); break;
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                found = gambitPremades.gambitItems.find(i => i.name === item.name && constants.itemTypes.includes(i.type)); break;
            case 'feat': found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'feat'); break;
        }
    } else if (type === 'npc') {
        let monster = identifier ?? item.actor.prototypeToken.name;
        found = gambitPremades.gambitMonsters.find(i => i.monster === monster && item.name === i.name);
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getMISCAutomation(item, {identifier} = {}) {
    let found;
    let type = item.actor?.type ?? 'character';
    if (type === 'character' || item.type === 'spell') {
        switch(item.type) {
            case 'spell': found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'spell'); break;
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                found = miscPremades.miscItems.find(i => i.name === item.name && constants.itemTypes.includes(i.type)); break;
            case 'feat': found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'feat'); break;
        }
    } else if (type === 'npc') {
        let monster = identifier ?? item.actor.prototypeToken.name;
        found = miscPremades.miscMonsters.find(i => i.monster === monster && item.name === i.name);
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getAllAutomations(item, options) {
    let setting = genericUtils.getCPRSetting('additionalCompendiums');
    let items = [];
    let type = item.actor?.type ?? 'character';
    if (type != 'character' && type != 'npc') return [];
    let monster;
    if (type === 'npc') monster = item.actor.prototypeToken.name;
    await Promise.all(Object.entries(setting).map(async i => {
        let found;
        let source;
        let version;
        switch (i[0]) {
            default:
                found = await getItemFromCompendium(i[0], item.name, {ignoreNotFound: true, matchType: item.type});
                source = i[0];
                break;
            case 'chris-premades':
                found = await getCPRAutomation(item, options);
                source = 'chris-premades';
                if (found) version = itemUtils.getVersion(found);
                break;
            case 'gambits-premades': 
                found = await getGPSAutomation(item, options);
                source = 'gambits-premades';
                if (found) {
                    if (type === 'npc') {
                        version = gambitPremades.gambitMonsters.find(i => i.name === item.name && i.monster === monster)?.version;
                    } else {
                        version = gambitPremades.gambitItems.find(i => i.name === item.name)?.version;
                    }
                }
                break;
            case 'midi-item-showcase-community':
                found = await getMISCAutomation(item, options);
                source = 'midi-item-showcase-community';
                version = miscPremades.miscItems.find(i => i.name === item.name)?.version;
                if (found) {
                    if (type === 'npc') {
                        version = miscPremades.miscMonsters.find(i => i.name === item.name && i.monster === monster)?.version;
                    } else {
                        version = miscPremades.miscItems.find(i => i.name === item.name)?.version;
                    }
                }
                break;
        }
        if (found) items.push({document: found, priority: i[1], source: source, version: version ?? itemUtils.getVersion(found)});
    }));
    return items.sort((a, b) => a.priority - b.priority);
}
async function getPreferredAutomation(item, options) {
    let items = await getAllAutomations(item, options);
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
async function getFilteredActorDocumentsFromCompendium(key, {maxCR, actorTypes, creatureTypes, creatureSubtypes, specificNames}={}) {
    let pack = game.packs.get(key);
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'img', 'system.details.cr', 'system.details.type', 'system.attributes.movement']});
    let filteredIndex = packIndex.filter(i => 
        (!actorTypes?.length || actorTypes.includes(i.type)) && 
        (!maxCR || i.system?.details?.cr <= maxCR) && 
        (!creatureTypes?.length || creatureTypes.includes(i.system?.details?.type?.value)) &&
        (!creatureSubtypes?.length || creatureSubtypes.includes(i.system?.details?.type?.subtype?.toLowerCase())) &&
        (!specificNames?.length || specificNames.includes(i.name))
    );
    filteredIndex = game.dnd5e.moduleArt.apply(filteredIndex);
    filteredIndex = filteredIndex.map(i => foundry.utils.mergeObject(i, {img: 'icons/svg/mystery-man.svg'}, {overwrite: !i.img}));
    return filteredIndex;
}
async function getFilteredItemDocumentsFromCompendium(key, {specificNames, types, actionTypes, badProperties}={}) {
    let pack = game.packs.get(key);
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'img', 'system.actionType', 'system.properties']});
    let filteredIndex = packIndex.filter(i => 
        (!specificNames?.length || specificNames.includes(i.name)) &&
        (!types?.length || types.includes(i.type)) &&
        (!actionTypes?.length || actionTypes.includes(i.system?.actionType)) &&
        (!badProperties?.length || badProperties.every(j => !i.system?.properties.includes(j)))
    );
    filteredIndex = game.dnd5e.moduleArt.apply(filteredIndex);
    filteredIndex = filteredIndex.map(i => foundry.utils.mergeObject(i, {img: 'systems/dnd5e/icons/svg/items/weapon.svg'}, {overwrite: !i.img}));
    return filteredIndex;
}
async function getAppliedOrPreferredAutomation(item, options) { // need to finish this - autumn
    let source = itemUtils.getSource(item);
    if (source) {
        switch (source) {
            case 'chris-premades': {
                return await getCPRAutomation(item, options);
            }
            case 'gambits-premades':{
                return await getGPSAutomation(item, options);
            }
            case 'midi-item-showcase-community': {
                return await getMISCAutomation(item, options);
            }
            default: {
                let document = await getItemFromCompendium(source, item.name, {ignoreNotFound: true});
                if (!document) document = await getPreferredAutomation(item);
                return document;
            }
        }
    } else {
        return await getPreferredAutomation(item, options);
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
    getFilteredActorDocumentsFromCompendium,
    getFilteredItemDocumentsFromCompendium,
    getAppliedOrPreferredAutomation
};