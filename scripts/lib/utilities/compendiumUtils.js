import {custom} from '../../events/custom.js';
import {acc} from '../../integrations/acc.js';
import {gambitPremades} from '../../integrations/gambitsPremades.js';
import {miscPremades} from '../../integrations/miscPremades.js';
import {constants, errors, genericUtils, itemUtils} from '../../utils.js';
async function getCPRAutomation(item, {identifier, rules = 'legacy', type = 'character'} = {}) {
    let keys = [];
    if (type === 'character' || item.type === 'spell') {
        keys = [];
        switch (item.type) {
            case 'spell':
                if (rules === 'legacy') {
                    keys.push(constants.packs.spells);
                } else {
                    keys.push(constants.modernPacks.spells);
                }
                break;
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                if (rules === 'legacy') {
                    keys.push(constants.packs.items);
                    if (genericUtils.getCPRSetting('thirdParty')) keys.push(constants.packs.thirdPartyItems);
                } else {
                    keys.push(constants.modernPacks.items);
                }
                break;
            case 'feat':
                if (item.system.type.value === 'race') {
                    if (rules === 'modern') break;
                    keys.push(constants.packs.raceFeatures);
                    //if (genericUtils.getCPRSetting('thirdParty')) keys.push(constants.packs.thirdPartyRaceFeatures);
                } else {
                    if (rules === 'modern') {
                        keys.push(constants.modernPacks.classFeatures);
                        keys.push(constants.modernPacks.feats);
                        keys.push(constants.modernPacks.actions);
                    } else {
                        keys.push(constants.packs.classFeatures);
                        if (genericUtils.getCPRSetting('thirdParty')) keys.push(constants.packs.thirdPartyClassFeatures);
                        keys.push(constants.packs.feats);
                        keys.push(constants.packs.actions);
                        keys.push(constants.packs.miscellaneous);
                        keys.push(constants.packs.actions);
                    }
                }
                break;
        }
        if (!keys.length) return;
    } else if (type === 'npc') {
        keys.push(constants.packs.monsterFeatures);
    } else return;
    let itemIdentifier = genericUtils.getIdentifier(item);
    let name = custom.getMacro(itemIdentifier, rules)?.name ?? CONFIG.chrisPremades.renamedItems[item.name] ?? item.name;
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
    let cprIdentifier = genericUtils.getCPRIdentifier(name, rules);
    for (let key of keys) {
        let found;
        if (cprIdentifier) {
            found = await getItemFromCompendium(key, cprIdentifier, {ignoreNotFound: true, folderId: folderId, byIdentifier: true});
        } else {
            found = await getItemFromCompendium(key, name, {ignoreNotFound: true, folderId: folderId});
        }
        if (found) return found;
    }
}
async function getGPSAutomation(item, {identifier, rules = 'legacy', type = 'character'} = {}) {
    let found;
    if (type === 'character' || item.type === 'spell') {
        switch(item.type) {
            case 'spell': found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'spell' && i.rules === rules); break;
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                found = gambitPremades.gambitItems.find(i => i.name === item.name && constants.itemTypes.includes(i.type) && i.rules === rules); break;
            case 'feat': found = gambitPremades.gambitItems.find(i => i.name === item.name && i.type === 'feat' && i.rules === rules); break;
        }
    } else if (type === 'npc') {
        let monster = identifier ?? item.actor.prototypeToken.name;
        found = gambitPremades.gambitMonsters.find(i => i.monster === monster && item.name === i.name && i.rules === rules);
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getMISCAutomation(item, {identifier, rules = 'legacy', type = 'character'} = {}) {
    let found;
    //let type = item.actor?.type ?? 'character';
    if (type === 'character' || item.type === 'spell') {
        switch(item.type) {
            case 'spell': found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'spell' && i.rules === rules); break;
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                found = miscPremades.miscItems.find(i => i.name === item.name && constants.itemTypes.includes(i.type) && i.rules === rules); break;
            case 'feat': found = miscPremades.miscItems.find(i => i.name === item.name && i.type === 'feat' && i.rules === rules); break;
        }
    } else if (type === 'npc') {
        let monster = identifier ?? item.actor.prototypeToken.name;
        found = miscPremades.miscMonsters.find(i => i.monster === monster && item.name === i.name && i.rules === rules);
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getACCAutomation(item, {identifier, rules = 'legacy', type = 'character'} = {}) {
    let found;
    if (type === 'character' || item.type === 'spell') {
        switch(item.type) {
            case 'spell': found = acc.accItems.find(i => i.name === item.name && i.type === 'spell' && i.rules === rules); break;
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                found = acc.accItems.find(i => i.name === item.name && constants.itemTypes.includes(i.type) && i.rules === rules); break;
            case 'feat': found = acc.accItems.find(i => i.name === item.name && i.type === 'feat' && i.rules === rules); break;
        }
    } else if (type === 'npc') {
        //
    }
    if (!found) return;
    return await fromUuid(found.uuid);
}
async function getAllAutomations(item, options = {}) {
    let setting = genericUtils.getCPRSetting('additionalCompendiums');
    let items = [];
    let type = item.actor?.type ?? 'character';
    if (type != 'character' && type != 'npc') return [];
    if (item.actor) {
        let classItem = item.actor.items.find(i => i.type === 'class');
        if (classItem) type = 'character';
    }
    let monster;
    if (type === 'npc') monster = item.actor.prototypeToken.name;
    options.type = type;
    await Promise.all(Object.entries(setting).map(async i => {
        let found;
        let source;
        let version;
        switch (i[0]) {
            default:
                found = await getItemFromCompendium(i[0], item.name, {ignoreNotFound: true, matchType: item.type, rules: options?.rules});
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
                if (found) {
                    if (type === 'npc') {
                        version = miscPremades.miscMonsters.find(i => i.name === item.name && i.monster === monster)?.version;
                    } else {
                        version = miscPremades.miscItems.find(i => i.name === item.name)?.version;
                    }
                }
                break;
            case 'automated-crafted-creations':
                found = await getACCAutomation(item, options);
                source = 'automated-crafted-creations';
                if (found) version = acc.accItems.find(i => i.name === item.name)?.version;
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
async function getItemFromCompendium(key, name, {ignoreNotFound, folderId, object = false, getDescription, translate, identifier, flatAttack, flatDC, castDataWorkflow, matchType, rules, byIdentifier, bySystemIdentifier} = {}) {
    let pack = game.packs.get(key);
    if (!pack) {
        if (!ignoreNotFound) errors.missingPack();
        return undefined;
    }
    let packIndex = await pack.getIndex({'fields': ['name', 'type', 'folder', 'system.source.rules', 'flags.chris-premades.info.identifier', 'system.identifier']});
    let match;
    let alwaysFilterFunc = (item) => {
        return (!folderId || (item.folder === folderId)) && (!matchType || (item.type === matchType)) && (!rules || (item.system.source.rules === (rules === 'modern' ? '2024' : '2014')));
    };
    if (!byIdentifier && !bySystemIdentifier) {
        match = packIndex.find(item => (item.flags['chris-premades']?.info?.aliases ?? []).concat(item.name).includes(name) && alwaysFilterFunc(item));
    } else if (!bySystemIdentifier) {
        match = packIndex.find(item => item.flags['chris-premades']?.info?.identifier === name && alwaysFilterFunc(item));
    } else {
        match = packIndex.find(item => item.system?.identifier === name && alwaysFilterFunc(item));
    }
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
            let activities = documentData.system.activities;
            if (flatAttack) {
                let activityIds = Object.entries(activities).filter(i => i[1].type === 'attack').map(i => i[0]);
                for (let activityId of activityIds) {
                    genericUtils.setProperty(documentData, 'system.activities.' + activityId + '.attack.flat', true);
                    genericUtils.setProperty(documentData, 'system.activities.' + activityId + '.attack.bonus', flatAttack);
                }
            }
            if (flatDC) {
                let activityIds = Object.entries(activities).filter(i => i[1].type === 'save').map(i => i[0]);
                for (let activityId of activityIds) {
                    genericUtils.setProperty(documentData, 'system.activities.' + activityId + '.save.dc', {
                        calculation: '',
                        formula: flatDC.toString(),
                        value: flatDC
                    });
                }
            }
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
async function getFilteredItemDocumentsFromCompendium(key, {specificNames, types, typeValues, badProperties}={}) {
    let pack = game.packs.get(key);
    let packIndex = await pack.getIndex({fields: ['name', 'type', 'img', 'system.type.value', 'system.properties']});
    let filteredIndex = packIndex.filter(i => 
        (!specificNames?.length || specificNames.includes(i.name)) &&
        (!types?.length || types.includes(i.type)) &&
        (!typeValues?.length || typeValues.includes(i.system?.type?.value)) &&
        (!badProperties?.length || badProperties.every(j => !i.system?.properties.includes(j)))
    );
    filteredIndex = game.dnd5e.moduleArt.apply(filteredIndex);
    filteredIndex = filteredIndex.map(i => foundry.utils.mergeObject(i, {img: 'systems/dnd5e/icons/svg/items/weapon.svg'}, {overwrite: !i.img}));
    return filteredIndex;
}
async function getAppliedOrPreferredAutomation(item, options) {
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
            case 'automated-crafted-creations': {
                return await getACCAutomation(item, options);
            }
            default: {
                let document = await getItemFromCompendium(source, item.name, {ignoreNotFound: true, rules: options?.rules});
                if (!document) document = await getPreferredAutomation(item, options);
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
    getACCAutomation,
    getAllAutomations,
    getItemFromCompendium,
    getPreferredAutomation,
    getActorFromCompendium,
    getFilteredActorDocumentsFromCompendium,
    getFilteredItemDocumentsFromCompendium,
    getAppliedOrPreferredAutomation
};