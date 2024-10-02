import {genericUtils} from '../utils.js';
let packs = [
    {
        key: 'misc-items',
        type: 'item'
    },
    {
        key: 'misc-class-features',
        type: 'feat'
    },
    {
        key: 'misc-feats',
        type: 'feat'
    },
    {
        key: 'misc-spells',
        type: 'spell'
    },
    {
        key: 'misc-race-features',
        type: 'feat'
    }
];
let monsterPacks = [
    {
        key: 'misc-monster-features'
    }
];
let miscItems = [];
let miscMonsters = [];
async function init(mode) {
    await Promise.all(packs.map(async i => {
        let pack = game.packs.get('midi-item-showcase-community.' + i.key);
        if (!pack) return;
        let index = await pack.getIndex({fields: ['name']});
        index.forEach(j => {
            let version = CONFIG['midi-item-showcase-community']?.automations?.[j.name]?.version;
            if (!version) {
                genericUtils.log('dev', j.name + ' from MISC is missing version info.');
            }
            miscItems.push({
                name: j.name,
                version: version,
                uuid: j.uuid,
                type: j.type
            });
        });
    }));
    if (mode === 2 || mode === 4) {
        let pack = game.packs.get('midi-item-showcase-community.misc-homebrew');
        if (pack) {
            let index = await pack.getIndex({fields: ['name', 'folderId']});
            let itemFolder = pack.folders.getName('Items');
            if (itemFolder) {
                index.forEach(k => {
                    let version = CONFIG['midi-item-showcase-community']?.automations?.[k.name]?.version;
                    if (!version) {
                        genericUtils.log('dev', k.name + ' from MISC is missing version info.');
                    }
                    if (k.folderId != itemFolder.id) return;
                    miscItems.push({
                        name: k.name,
                        version: version,
                        uuid: k.uuid,
                        type: k.type
                    });
                });
            }
        }
    }
    if (mode === 3 || mode === 4) {
        let pack = game.packs.get('midi-item-showcase-community.misc-unearthed-arcana');
        if (pack) {
            let index = await pack.getIndex({fields: ['name', 'folderId']});
            let spellsFolder = pack.folders.getName('Spells');
            if (spellsFolder) {
                index.forEach(l => {
                    let version = CONFIG['midi-item-showcase-community']?.automations?.[l.name]?.version;
                    if (!version) {
                        genericUtils.log('dev', l.name + ' from MISC is missing version info.');
                    }
                    if (l.folderId != spellsFolder.id) return;
                    miscItems.push({
                        name: l.name,
                        version: version,
                        uuid: l.uuid,
                        type: l.type
                    });
                });
            }
            let classFeaturesFolder = pack.folders.getName('Class Features');
            if (classFeaturesFolder) {
                index.forEach(m => {
                    let validFolder = false;
                    let folder = m.folder;
                    while (!validFolder) {
                        if (folder.id === classFeaturesFolder.id) {
                            validFolder = true;
                            break;
                        }
                        if (folder.folder) {
                            folder = folder.folder;
                            break;
                        } else {
                            return;
                        }
                    }
                    let version = CONFIG['midi-item-showcase-community']?.automations?.[m.name]?.version;
                    if (!version) {
                        genericUtils.log('dev', m.name + ' from MISC is missing version info.');
                    }
                    miscItems.push({
                        name: m.name,
                        version: version,
                        uuid: m.uuid,
                        type: m.uuid
                    });
                });
            }
        }
    }
    await Promise.all(monsterPacks.map(async i => {
        let pack = game.packs.get('midi-item-showcase-community.' + i.key);
        if (!pack) return;
        let index = await pack.getIndex({fields: ['name', 'folder']});
        index.forEach(j => {
            let folder = pack.folders.contents.find(k => k.id === j.folder);
            if (!folder) return;
            let monster = folder.name;
            let version = CONFIG['midi-item-showcase-community']?.monsterAutomations?.[monster]?.[j.name]?.version;
            if (!version) {
                genericUtils.log('dev', j.name + ' (' + monster + ') from MISC is missing version info.');
            }
            miscMonsters.push({
                name: j.name,
                version: version,
                uuid: j.uuid,
                monster: monster
            });
        });
    }));
}
export let miscPremades = {
    init,
    miscItems,
    miscMonsters
};