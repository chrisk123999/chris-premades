import {genericUtils} from '../utils.js';
let packs = [
    {
        key: 'gps-spells',
        type: 'spell',
        homebrew: false,
        thirdParty: false
    },
    {
        key: 'gps-class-features',
        type: 'feat',
        homebrew: false,
        thirdParty: false
    },
    {
        key: 'gps-items',
        type: 'item',
        homebrew: false,
        thirdParty: false
    },
    {
        key: 'gps-generic-features',
        type: 'feat',
        homebrew: false,
        thirdParty: false
    },
    {
        key: 'gps-homebrew-features',
        type: 'feat',
        homebrew: true,
        thirdParty: false
    },
    {
        key: 'gps-homebrew-items',
        type: 'spell',
        homebrew: true,
        thirdParty: false
    },
    {
        key: 'gps-homebrew-spells',
        type: 'spell',
        homebrew: true,
        thirdParty: false
    },
    {
        key: 'gps-3rd-party-features',
        type: 'feat',
        homebrew: false,
        thirdParty: true
    },
    {
        key: 'gps-3rd-party-items',
        type: 'item',
        homebrew: false,
        thirdParty: true
    },
    {
        key: 'gps-3rd-party-spells',
        type: 'spell',
        homebrew: false,
        thirdParty: true
    },
    {
        key: 'gps-race-features',
        type: 'feat',
        homebrew: false,
        thirdParty: false
    }
];
let monsterPacks = [
    {
        key: 'gps-monster-features'
    }
];
let gambitItems = [];
let gambitMonsters = [];
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
    let validPacks;
    switch(mode) {
        case 1: validPacks = packs.filter(i => !i.homebrew && !i.thirdParty); break;
        case 2: validPacks = packs.filter(i => !i.homebrew); break;
        case 3: validPacks = packs.filter(i => !i.thirdParty); break;
        case 4: validPacks = packs;
    }
    for (let {suffix, rules} of rulesVariants) {
        await Promise.all(validPacks.map(async i => {
            let pack = game.packs.get('gambits-premades.' + i.key + suffix);
            if (!pack) return;
            let index = await pack.getIndex({fields: ['name', 'system.source.custom', 'type']});
            index.forEach(j => {
                let version = j.system.source.custom;
                if (!version) genericUtils.log('dev', j.name + ' from GPS is missing version info.');
                gambitItems.push({
                    name: j.name,
                    version: j.system.source.custom,
                    uuid: j.uuid,
                    type: j.type,
                    rules
                });
            });
        }));
        await Promise.all(monsterPacks.map(async i => {
            let pack = game.packs.get('gambits-premades.' + i.key + suffix);
            if (!pack) return;
            let index = await pack.getIndex({fields: ['name', 'system.source.custom', 'folder']});
            index.forEach(j => {
                let version = j.system.source.custom;
                if (!version) {
                    genericUtils.log('dev', j.name + ' from GPS is missing version info.');
                }
                let folder = pack.folders.contents.find(k => k.id === j.folder);
                if (!folder) return;
                gambitMonsters.push({
                    name: j.name,
                    version: j.system.source.custom,
                    uuid: j.uuid,
                    monster: folder.name,
                    rules
                });
            });
        }));
    }
}
export let gambitPremades = {
    init,
    gambitItems,
    gambitMonsters
};