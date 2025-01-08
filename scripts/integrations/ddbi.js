import {item} from '../applications/item.js';
import * as legacyMacros from '../legacyMacros.js';
import * as macros from '../macros.js';
import {compendiumUtils, constants, genericUtils, itemUtils} from '../utils.js';
import {gambitPremades} from './gambitsPremades.js';
import {miscPremades} from './miscPremades.js';
async function ready() {
    let config = {
        removeChoices: [],
        renamedItems: {},
        additionalItems: {},
        removedItems: {},
        restrictedItems: {},
        correctedItems: {}
    };
    Object.values(legacyMacros).forEach(i => {
        let ddbi = i.ddbi;
        if (!ddbi) return;
        if (ddbi.removeChoices) config.removeChoices.push(...ddbi.removeChoices);
        if (ddbi.renamedItems) Object.entries(ddbi.renamedItems).forEach(j => config.renamedItems[j[0]] = j[1]);
        if (ddbi.additionalItems) Object.entries(ddbi.additionalItems).forEach(k => config.additionalItems[k[0]] = k[1]);
        if (ddbi.removedItems) Object.entries(ddbi.removedItems).forEach(l => config.removedItems[l[0]] = l[1]);
        if (ddbi.restrictedItems) Object.entries(ddbi.restrictedItems).forEach(m => config.restrictedItems[m[0]] = m[1]);
        if (ddbi.correctedItems) Object.entries(ddbi.correctedItems).forEach(n => config.correctedItems[n[0]] = n[1]);
    });
    Object.values(macros).forEach(i => {
        let ddbi = i.ddbi;
        if (!ddbi) return;
        if (ddbi.removeChoices) config.removeChoices.push(...ddbi.removeChoices);
        if (ddbi.renamedItems) Object.entries(ddbi.renamedItems).forEach(j => config.renamedItems[j[0]] = j[1]);
        if (ddbi.additionalItems) Object.entries(ddbi.additionalItems).forEach(k => config.additionalItems[k[0]] = k[1]);
        if (ddbi.removedItems) Object.entries(ddbi.removedItems).forEach(l => config.removedItems[l[0]] = l[1]);
        if (ddbi.restrictedItems) Object.entries(ddbi.restrictedItems).forEach(m => config.restrictedItems[m[0]] = m[1]);
        if (ddbi.correctedItems) Object.entries(ddbi.correctedItems).forEach(n => config.correctedItems[n[0]] = n[1]);
    });
    genericUtils.setProperty(CONFIG, 'chrisPremades', config);
}
function workaround() {
    globalThis['chrisPremades'].helpers = {
        getSearchCompendiums: function _getSearchCompendiums(itemType) {
            let additionalCompendiumSettings = genericUtils.getCPRSetting('additionalCompendiums');
            let gambitItems = game.modules.get('gambits-premades')?.active && Object.keys(additionalCompendiumSettings).includes('gambits-premades');
            let miscItems = game.modules.get('midi-item-showcase-community')?.active && Object.keys(additionalCompendiumSettings).includes('midi-item-showcase-community');
            let gambitSettings = genericUtils.getCPRSetting('gambitPremades');
            let miscSettings = genericUtils.getCPRSetting('miscPremades');
            let searchCompendiums = [];
            switch (itemType) {
                case 'weapon':
                case 'equipment':
                case 'consumable':
                case 'tool':
                case 'backpack':
                case 'loot':
                    searchCompendiums.push(constants.packs.items);
                    if (gambitItems) {
                        searchCompendiums.push('gambits-premades.gps-items');
                        if (gambitSettings === 2 || gambitSettings === 4) searchCompendiums.push('gambits-premades.gps-3rd-party-items');
                        if (gambitSettings === 3 || gambitSettings === 4) searchCompendiums.push('gambits-premades.gps-homebrew-items');
                    }
                    if (miscItems) {
                        searchCompendiums.push('midi-item-showcase-community.misc-items');
                        if (miscSettings === 2 || miscSettings === 4) searchCompendiums.push('midi-item-showcase-community.misc-homebrew');
                        if (miscSettings === 3 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-unearthed-arcana');
                    }
                    break;
                case 'spell':
                    searchCompendiums.push(constants.packs.spells);
                    if (gambitItems) {
                        searchCompendiums.push('gambits-premades.gps-spells');
                        if (gambitSettings === 2 || gambitSettings === 4) searchCompendiums.push('gambits-premades.gps-3rd-party-spells');
                        if (gambitSettings === 3 || gambitSettings === 4) searchCompendiums.push('gambits-premades.gps-homebrew-spells');
                    }
                    if (miscItems) {
                        searchCompendiums.push('midi-item-showcase-community.misc-spells');
                        if (miscSettings === 2 || miscSettings === 4) searchCompendiums.push('midi-item-showcase-community.misc-homebrew');
                        if (miscSettings === 3 || miscSettings === 4) searchCompendiums.push('midi-item-showcase-community.misc-unearthed-arcana');
                    }
                    break;
                case 'feat':
                    searchCompendiums.push(constants.packs.classFeatures, constants.packs.feats);
                    if (gambitItems) {
                        searchCompendiums.push('gambits-premades.gps-class-features');
                        searchCompendiums.push('gambits-premades.gps-generic-features');
                        searchCompendiums.push('gambits-premades.gps-race-features');
                        if (gambitSettings === 2 || gambitSettings === 4) searchCompendiums.push('gambits-premades.gps-3rd-party-features');
                        if (gambitSettings === 3 || gambitSettings === 4) searchCompendiums.push('gambits-premades.gps-homebrew-items');
                    }
                    if (miscSettings) {
                        searchCompendiums.push('midi-item-showcase-community.misc-class-features');
                        searchCompendiums.push('midi-item-showcase-community.misc-feats');
                        searchCompendiums.push('midi-item-showcase-community.misc-race-features');
                        if (miscSettings === 2 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-homebrew');
                        if (miscSettings === 1 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-unearthed-arcana');
                    }
                    break;
            }
            let ignore = [
                'chris-premades',
                'gambits-premades',
                'midi-item-showcase-community'
            ];
            let chrisPacks = Object.values(constants.packs);
            let gambitPacks = gambitItems && game.modules.get('gambits-premades')?.active? Array.from(game.modules.get('gambits-premades').packs).map(i => i.id) : [];
            let miscPacks = miscItems && game.modules.get('midi-item-showcase-community')?.active ? Array.from(game.modules.get('midi-item-showcase-community').packs).map(i => i.id) : [];
            searchCompendiums.push(...Object.keys(additionalCompendiumSettings).filter(i => !ignore.includes(i)));
            searchCompendiums.sort((a, b) => {
                let numA = additionalCompendiumSettings[a] ?? 1000;
                let numB = additionalCompendiumSettings[b] ?? 1000;
                if (chrisPacks.includes(a)) numA = additionalCompendiumSettings['chris-premades'];
                if (chrisPacks.includes(b)) numB = additionalCompendiumSettings['chris-premades'];
                if (gambitPacks.includes(a)) numA = additionalCompendiumSettings['gambits-premades'];
                if (gambitPacks.includes(b)) numB = additionalCompendiumSettings['gambits-premades'];
                if (miscPacks.includes(a)) numA = additionalCompendiumSettings['midi-item-showcase-community'];
                if (miscPacks.includes(b)) numB = additionalCompendiumSettings['midi-item-showcase-community'];
                return numA - numB;
            });
            return searchCompendiums;
        }
    };
}
async function getAutomation(itemName, options = {rules: '2014', actorType: 'character', itemType: 'spell', monsterName: undefined, featType: undefined}) {
    let setting = genericUtils.getCPRSetting('additionalCompendiums');
    let items = [];
    let fakeDocument = {
        name: itemName,
        type: options.itemType,
        actor: {
            type: options.actorType,
            prototypeToken: {
                name: options.monsterName
            }
        },
        system: {
            type: {
                value: options.featType
            }
        },
        flags: {}
    };
    await Promise.all(Object.entries(setting).map(async i => {
        let found;
        let source;
        let version;
        switch(i[0]) {
            default:
                found = await compendiumUtils.getItemFromCompendium(i[0], fakeDocument.name, {ignoreNotFound: true, matchType: fakeDocument.type});
                source = i[0];
                break;
            case 'chris-premades':
                found = await compendiumUtils.getCPRAutomation(fakeDocument, options);
                source = 'chris-premades';
                if (found) version = itemUtils.getVersion(found);
                break;
            case 'gambits-premades': 
                found = await compendiumUtils.getGPSAutomation(fakeDocument, options);
                source = 'gambits-premades';
                if (found) {
                    if (options.actorType === 'npc') {
                        version = gambitPremades.gambitMonsters.find(i => i.name === fakeDocument.name && i.monster === options.monsterName)?.version;
                    } else {
                        version = gambitPremades.gambitItems.find(i => i.name === fakeDocument.name)?.version;
                    }
                }
                break;
            case 'midi-item-showcase-community':
                found = await compendiumUtils.getMISCAutomation(fakeDocument, options);
                source = 'midi-item-showcase-community';
                version = miscPremades.miscItems.find(i => i.name === fakeDocument.name)?.version;
                if (found) {
                    if (options.actorType === 'npc') {
                        version = miscPremades.miscMonsters.find(i => i.name === fakeDocument.name && i.monster === options.monsterName)?.version;
                    } else {
                        version = miscPremades.miscItems.find(i => i.name === fakeDocument.name)?.version;
                    }
                }
                break;
        }
        if (found) items.push({document: found, priority: i[1], source: source, version: version ?? itemUtils.getVersion(found)});
    }));
    if (!items.length) return;
    items = items.sort((a, b) => a.priority - b.priority);
    let itemData = genericUtils.duplicate(items[0].document.toObject());
    genericUtils.setProperty(itemData, 'flags.chris-premades.info', {
        rules: options.rules === '2014' ? 'legacy' : 'modern',
        source: items[0].source,
        version: items[0].version
    });
    return itemData;
}
export let ddbi = {
    ready,
    workaround,
    getAutomation
};