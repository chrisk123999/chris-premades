import * as macros from '../../macros.js';
import {constants} from '../constants.js';
import {errors} from '../errors.js';
import {itemUtils} from './itemUtils.js';
async function getCPRAutomation(item) {
    let key;
    switch (item.type) {
        case 'spell':
            key = constants.packs.spells;
            break; 
    }
    let identifier = itemUtils.getIdentifer(item);
    let name = macros[identifier]?.name ?? item.name;
    let folderId;
    let type = item.actor?.type ?? 'character';
    if (type === 'npc' && item.type != 'spell') {
        let name = item.actor.prototypeToken.name;
        let pack = game.packs.get(key);
        if (!pack) {
            errors.missingPack();
            return;
        }
        folderId = pack.folders.find(i => i.name === name)?.id;
    }
    return await getItemFromCompendium(key, name, {ignoreNotFound: true, folderId: folderId});
}
async function getGPSAutomation(item) {

}
async function getMISCAutomation(item) {

}
async function getItemFromCompendium(key, name, {ignoreNotFound, folderId}) {
    let pack = game.packs.get(key);
    if (!pack) {
        errors.missingPack();
        return undefined;
    }
    let packIndex = await pack.getIndex({'fields': ['name', 'type', 'folder']});
    let match = packIndex.find(item => item.name === name && (!folderId || (folderId && item.folder === folderId)));
    if (match) {
        return await pack.getDocument(match._id);
    } else {
        if (!ignoreNotFound) errors.missingPackItem();
        return undefined;
    }
}
export let compendiumUtils = {
    getCPRAutomation,
    getGPSAutomation,
    getMISCAutomation,
    getItemFromCompendium
};