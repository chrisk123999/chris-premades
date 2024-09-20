import {compendiumUtils, constants, genericUtils, itemUtils} from '../utils.js';
import * as macros from '../macros.js';
import {custom} from './custom.js';
async function addOrUpdate(item, updates, options, id) {
    if (!item.actor) return;
    let identifier = item.flags['chris-premades']?.equipment?.identifier;
    if (!identifier) return;
    let equipmentData = custom.customMacroList.find(i => i.identifier === identifier)?.equipment ?? macros[identifier]?.equipment;
    if (!equipmentData) return;
    let currentlyEquipped = updates.system?.equipped ?? item.system.equipped;
    let currentlyAttuned = updates.system?.attuned ?? item.system.attuned;
    let previouslyEquipped = item.system?.equipped;
    let previouslyAttuned = item.system?.attuned;
    let attunement = updates.system?.attunement ?? item.system?.attunement;
    let validTypes = ['required', 'optional'];
    let requiresAttunement = validTypes.includes(attunement);
    let previousState = ((requiresAttunement && previouslyAttuned) || !requiresAttunement) && previouslyEquipped ? true : false; 
    let currentState = ((requiresAttunement && currentlyAttuned) || !requiresAttunement) && currentlyEquipped ? true : false;
    if (previousState === currentState) return;
    if (previousState && !currentState) {
        let removeItems = item.actor.items.filter(i => i.flags['chris-premades']?.equipment?.parent?.id === item.id);
        let newUpdates = {};
        removeItems.forEach(i => {
            if (!i.system.uses.per) return;
            let key = i.flags['chris-premades'].equipment.parent.key;
            genericUtils.setProperty(newUpdates, 'flags.chris-premades.equipment.uses.' + key, i.system.uses);
        });
        if (Object.keys(newUpdates).length) await genericUtils.update(item, newUpdates);
        let callbacks = Object.values(equipmentData).filter(i => i.unequipCallback).map(j => j.unequipCallback);
        if (callbacks.length) for (let i of callbacks) await i(item);
        await genericUtils.deleteEmbeddedDocuments(item.actor, 'Item', removeItems.map(i => i.id));
        
    } else if (!previousState && currentState) {
        let callbacks = [];
        let updates = await Promise.all(Object.entries(equipmentData).map(async ([key, value]) => {
            if (value.equipCallback) callbacks.push(value.equipCallback);
            let packKey;
            let descriptionPackKey;
            let description;
            switch(value.compendium) {
                case 'spell':
                    packKey = constants.packs.spells;
                    descriptionPackKey = genericUtils.getCPRSetting('spellCompendium');
                    break;
                case 'itemEquipment':
                    packKey = constants.packs.itemFeatures;
                    break;
                case 'personalSpell':
                    packKey = genericUtils.getCPRSetting('spellCompendium');
                    descriptionPackKey = packKey;
                    break;
            }
            if (!packKey) return;
            let itemData = await compendiumUtils.getItemFromCompendium(packKey, value.name, {object: true});
            if (!itemData) return;
            if (descriptionPackKey) {
                let pack = game.packs.get(descriptionPackKey);
                if (pack) {
                    let descriptionItemData = await compendiumUtils.getItemFromCompendium(descriptionPackKey, value.name, {ignoreNotFound: true, object: true});
                    if (descriptionItemData) description = descriptionItemData.system.description;
                }
            } else if (value.useJournal) {
                description = itemUtils.getItemDescription(itemData.name);
            }
            if (description) genericUtils.setProperty(itemData, 'system.description', description);
            if (value.uses) genericUtils.setProperty(itemData, 'system.uses', item.flags['chris-premades']?.equipment?.uses?.[key] ?? value.uses);
            if (value.preparation) genericUtils.setProperty(itemData, 'system.preparation.mode', value.preparation);
            if (value.duration) genericUtils.setProperty(itemData.system.duration, value.duration);
            if (value.translate) itemData.name = genericUtils.translate(value.translate);
            if (value.override) genericUtils.mergeObject(itemData, value.override);
            genericUtils.setProperty(itemData, 'flags.chris-premades.equipment.parent.id', item.id);
            genericUtils.setProperty(itemData, 'flags.chris-premades.equipment.parent.key', key);
            delete itemData._id;
            return [itemData, value.favorite];
        }));
        updates = updates.filter(i => i);
        let favoriteUpdates = updates.filter(i => i[1]).map(i => i[0]);
        let nonFavoriteUpdates = updates.filter(i => !i[1]).map(i => i[0]);
        if (favoriteUpdates.length) await itemUtils.createItems(item.actor, favoriteUpdates, {favorite: true, section: item.name});
        if (nonFavoriteUpdates.length) await itemUtils.createItems(item.actor, nonFavoriteUpdates, {section: item.name});
        if (callbacks.length) for (let i of callbacks) await i(item);
    }
}
async function remove(item, options, id) {
    if (!item.actor) return;
    let removeItemIds = item.actor.items.filter(i => i.flags['chris-premades']?.equipment?.parent?.id === item.id).map(j => j.id);
    await genericUtils.deleteEmbeddedDocuments(item.actor, 'Item', removeItemIds);
}
export let equipment = {
    addOrUpdate,
    remove
};