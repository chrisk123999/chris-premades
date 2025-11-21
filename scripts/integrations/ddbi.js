import {monster} from '../extensions/monster.js';
import * as legacyMacros from '../legacyMacros.js';
import * as macros from '../macros.js';
import {compendiumUtils, genericUtils, itemUtils} from '../utils.js';
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
async function getAutomation(itemName, options = {rules: '2014', actorType: 'character', itemType: 'spell', monsterName: undefined, featType: undefined}) {
    console.log(options);
    let setting = genericUtils.getCPRSetting('additionalCompendiums');
    let items = [];
    let fakeDocument = {
        name: itemName,
        type: options.itemType,
        actor: {
            type: options.actorType,
            prototypeToken: {
                name: options.monsterName
            },
            classes: {}
        },
        system: {
            type: {
                value: options.featType
            },
            source: {
                rules: options.rules
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
                options.rules = options.rules === '2014' ? 'legacy' : options.rules === '2024' ? 'modern' : options.rules;
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
    genericUtils.setProperty(itemData, 'flags.chris-premades.info.rules', options.rules === '2014' ? 'legacy' : options.rules === '2024' ? 'modern' : options.rules);
    genericUtils.setProperty(itemData, 'flags.chris-premades.info.source', items[0].source);
    genericUtils.setProperty(itemData, 'flags.chris-premades.info.version', items[0].version);
    return itemData;
}
async function monsterGenerics({actor}) {
    await monster.monsterGenerics(actor);
}
export let ddbi = {
    ready,
    getAutomation,
    monsterGenerics
};