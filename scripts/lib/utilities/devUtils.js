import * as macros from '../../legacyMacros.js';
import {constants, genericUtils} from '../../utils.js';
async function setMacro(entityUuid, key, values = []) {
    if (!key) return;
    let entity = await fromUuid(entityUuid);
    if (!entity) return;
    return await entity.setFlag('chris-premades', 'macros.' + key, values);
}
export async function stripUnusedFlags(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        if (!(Object.values(constants.featurePacks).includes(key) || key === 'world.cpr-summons' || key === 'world.cpr-summons-2024')) {
            if (!hasVersionInfo(i)) genericUtils.log('dev', i.name + ' is missing version info!');
        }
        let updates = {
            'flags.-=ddbimporter': null,
            'flags.-=itemacro': null,
            'flags.-=cf': null,
            'flags.-=custom-character-sheet-sections': null,
            'flags.-=rest-recovery': null,
            'flags.-=exportSource': null,
            'flags.-=autoanimations': null,
            'flags.-=betterRolls5e': null,
            'flags.-=tidy5e-sheet': null,
            'flags.-=walledtemplates': null,
            'flags.-=templatemacro': null,
            'flags.-=spell-class-filter-for-5e': null,
            'flags.-=favtab': null,
            'flags.-=enhanced-terrain-layer': null,
            'flags.-=tidy5e-sheet-kgar': null,
            'flags.-=LocknKey': null,
            'flags.-=monsterMunch': null,
            'flags.-=magicitems': null,
            system: {
                description: {
                    value: '',
                    chat: ''
                },
                sourceClass: ''
            }
        };
        let identifier = i.flags['chris-premades']?.info?.identifier;
        if (identifier) {
            if (macros[identifier]?.config?.find(i => i.value === 'playAnimation')) genericUtils.setProperty(updates, 'flags.chris-premades.info.hasAnimation', true);
        }
        if (key === constants.packs.miscellaneous) delete updates.system.description;
        await i.update(updates);
    }
}
function hasVersionInfo(item) {
    return !!item.flags['chris-premades']?.info?.version;
}
export async function updateAllCompendiums() {
    let packs = game.packs.filter(i => i.metadata.label.includes('CPR') && i.metadata.packageType === 'world');
    await Promise.all(packs.map(async i => {
        await stripUnusedFlags(i.metadata.id);
    }));
    return 'Done!';
}
export let devUtils = {
    setMacro,
    stripUnusedFlags,
    updateAllCompendiums,
    hasVersionInfo
};