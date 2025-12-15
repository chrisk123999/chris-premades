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
    },
    {
        key: 'misc-actions',
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
    let rulesVariants = [
        {
            suffix: '',
            rules: 'legacy'
        },
        {
            suffix: '-2024',
            rules: 'modern'
        }
    ];
    for (let {suffix, rules} of rulesVariants) {
        await Promise.all(packs.map(async i => {
            let pack = game.packs.get('midi-item-showcase-community.' + i.key + suffix);
            if (!pack) return;
            let index = await pack.getIndex({fields: ['name']});
            index.forEach(j => {
                let factory = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[j.name]?.factory;
                if (factory) return;
                let aliases = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[j.name]?.aliases;
                let version = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[j.name]?.version;
                if (aliases) genericUtils.log('dev', j.name + ' has aliases!');
                if (!version) genericUtils.log('dev', j.name + ' from MISC is missing version info.');
                miscItems.push({
                    name: j.name,
                    version: version,
                    uuid: j.uuid,
                    type: j.type,
                    rules,
                    aliases
                });
            });
        }));
        if (mode === 2 || mode === 4) {
            let pack = game.packs.get('midi-item-showcase-community.misc-homebrew' + suffix);
            if (pack) {
                let index = await pack.getIndex({fields: ['name', 'folderId']});
                let itemFolder = pack.folders.getName('Items');
                if (itemFolder) {
                    index.forEach(k => {
                        let factory = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[k.name]?.factory;
                        if (factory) return;
                        let aliases = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[k.name]?.aliases;
                        let version = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[k.name]?.version;
                        if (!version) {
                            genericUtils.log('dev', k.name + ' from MISC is missing version info.');
                        }
                        if (k.folderId != itemFolder.id) return;
                        miscItems.push({
                            name: k.name,
                            version: version,
                            uuid: k.uuid,
                            type: k.type,
                            rules,
                            aliases
                        });
                    });
                }
            }
        }
        if (mode === 3 || mode === 4) {
            let pack = game.packs.get('midi-item-showcase-community.misc-unearthed-arcana' + suffix);
            if (pack) {
                let index = await pack.getIndex({fields: ['name', 'folderId']});
                let spellsFolder = pack.folders.getName('Spells');
                if (spellsFolder) {
                    index.forEach(l => {let factory = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[l.name]?.factory;
                        if (factory) return;
                        let aliases = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[l.name]?.aliases;
                        let rules = l.system.source.rules === '2024' ? 'modern' : 'legacy';
                        let version = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[l.name]?.version;
                        if (!version) {
                            genericUtils.log('dev', l.name + ' from MISC is missing version info.');
                        }
                        if (l.folderId != spellsFolder.id) return;
                        miscItems.push({
                            name: l.name,
                            version: version,
                            uuid: l.uuid,
                            type: l.type,
                            rules,
                            aliases
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
                        let version = CONFIG['midi-item-showcase-community']?.automations?.[rules]?.[m.name]?.version;
                        if (!version) {
                            genericUtils.log('dev', m.name + ' from MISC is missing version info.');
                        }
                        miscItems.push({
                            name: m.name,
                            version: version,
                            uuid: m.uuid,
                            type: m.uuid,
                            rules
                        });
                    });
                }
            }
        }
        await Promise.all(monsterPacks.map(async i => {
            let pack = game.packs.get('midi-item-showcase-community.' + i.key + suffix);
            if (!pack) return;
            let index = await pack.getIndex({fields: ['name', 'folder']});
            index.forEach(j => {
                let folder = pack.folders.contents.find(k => k.id === j.folder);
                if (!folder) return;
                let monster = folder.name;
                let version = CONFIG['midi-item-showcase-community']?.monsterAutomations?.[rules]?.[monster]?.[j.name]?.version;
                if (!version) {
                    genericUtils.log('dev', j.name + ' (' + monster + ') from MISC is missing version info.');
                }
                miscMonsters.push({
                    name: j.name,
                    version: version,
                    uuid: j.uuid,
                    monster: monster,
                    rules
                });
            });
        }));
    }
}
export let miscPremades = {
    init,
    miscItems,
    miscMonsters
};