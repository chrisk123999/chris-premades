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
let gambitItems = [];
async function init(mode) {
    let validPacks;
    switch(mode) {
        case 1: validPacks = packs.filter(i => !i.homebrew && !i.thirdParty); break;
        case 2: validPacks = packs.filter(i => !i.homebrew); break;
        case 3: validPacks = packs.filter(i => !i.thirdParty); break;
        case 4: validPacks = packs;
    }
    await Promise.all(validPacks.map(async i => {
        let pack = game.packs.get('gambits-premades.' + i.key);
        if (!pack) return;
        let index = await pack.getIndex({fields: ['name', 'system.source.custom', 'type']});
        index.forEach(j => {
            let version = j.system.source.custom;
            if (!version) {
                genericUtils.log('dev', j.name + ' from GPS is missing version info.');
            }
            gambitItems.push({
                name: j.name,
                version: j.system.source.custom,
                uuid: j.uuid,
                type: j.type
            });
        });
    }));
}
export let gambitPremades = {
    init,
    gambitItems
};