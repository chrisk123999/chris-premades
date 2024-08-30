import {compendiumUtils, constants, genericUtils, itemUtils} from '../utils.js';
import * as macros from '../macros.js';
import {custom} from '../events/custom.js';
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
        let updates = {};
        removeItems.forEach(i => {
            if (!i.system.uses.per) return;
            let key = i.flags['chris-premades'].equipment.parent.key;
            genericUtils.setProperty(updates, 'flags.chris-premades.equipment.uses.' + key, i.system.uses);
        });
        item.updateSource(updates);
        await genericUtils.deleteEmbeddedDocuments(item.actor, 'Item', removeItems.map(i => i.id));
    } else if (!previousState && currentState) {
        let updates = await Promise.all(Object.entries(equipmentData).map(async ([key, value]) => {
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
                    descriptionPackKey = genericUtils.getCPRSetting('spellCompendium');
                    break;
            }
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
            genericUtils.setProperty(itemData, 'flags.chris-premades.equipment.parent.id', item.id);
            genericUtils.setProperty(itemData, 'flags.chris-premades.equipment.parent.key', key);
            return itemData;
        }));
        if (updates.length) await itemUtils.createItems(item.actor, updates, {section: item.name});
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