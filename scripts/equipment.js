import {chris} from './helperFunctions.js';
export async function itemFeatures(item, updates, options, id) {
    if (!item?.actor) return;
    let chrisFeatures = item.flags?.['chris-premades']?.equipment;
    if (!chrisFeatures) return;
    let currentlyEquipped = updates.system?.equipped ?? item.system.equipped;
    let currentlyAttuned = updates.system?.attunement ?? item.system.attunement;
    let currentItems = item.actor.items.filter(i => i.flags?.['chris-premades']?.equipmentFeature?.id === item.id) || [];
    if (!currentlyAttuned && !currentlyEquipped && currentItems.length === 0) return;
    let previouslyEquipped = item.system?.equipped;
    let previouslyAttuned = item.system?.attunement;
    let previousState = previouslyEquipped && (previouslyAttuned === 0 || previouslyAttuned === 2);
    let currentState = currentlyEquipped && (currentlyAttuned === 0 || currentlyAttuned === 2);
    let currentSourceUuid = foundry.utils.getProperty(item, "flags.core.sourceId");
    if (previousState === currentState) return;
    if (previousState && !currentState) {
        let removeItems = currentItems;
        if (removeItems.length === 0) return;
        let updates = {};
        for (let i of removeItems) setProperty(updates, 'flags.chris-premades.equipment.uses.' + i.name, i.system.uses);
        await item.update(updates);
        await item.actor.deleteEmbeddedDocuments('Item', removeItems.map(i => i.id));
    } else if (!previousState && currentState) {
        let addItemsUniqueNames = currentItems.map(i => {return i.flags?.['chris-premades']?.equipmentFeature?.uniqueName});
        let items = [];
        for (let i of chrisFeatures.items) {
            if(addItemsUniqueNames.includes(i.uniqueName)) continue;
            let itemData = await chris.getItemFromCompendium(i.key, i.name);
            if (!itemData) continue;
            itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', i.name);
            let uses = getProperty(item, 'flags.chris-premades.equipment.uses.' + i.name);
            if (uses) setProperty(itemData, 'system.uses', uses);
            setProperty(itemData, 'flags.chris-premades.equipmentFeature.id', item.id);
            setProperty(itemData, 'flags.core.sourceId', item.uuid || currentSourceUuid);
            setProperty(itemData, 'system.source.custom', item.name);
            if (i.uniqueName) setProperty(itemData, 'flags.chris-premades.equipmentFeature.uniqueName', i.uniqueName);
            else console.warn('chris-premades | You must set a uniqueName for the Chris Premades Equipment', i, item);
            items.push(itemData);
        }
        if (!items.length) return;
        await item.actor.createEmbeddedDocuments('Item', items);
    }
}
export async function itemFeaturesDelete(item, options, id) {
    if (!item.actor) return;
    let chrisFeatures = item.flags?.['chris-premades']?.equipment;
    if (!chrisFeatures) return;
    let currentlyEquipped = item.system.equipped;
    let currentlyAttuned = item.system.attunement;
    if (!currentlyEquipped && currentlyAttuned === 1) return;
    let removeItems = item.actor.items.filter(i => i.flags?.['chris-premades']?.equipmentFeature?.id === item.id);
    if (removeItems.length === 0) return;
    await item.actor.deleteEmbeddedDocuments('Item', removeItems.map(i => i.id));
}
export async function applyEquipmentFlag(uuid) {
    let updates = {
        'flags.chris-premades.equipment.items': [
            {
                'name': 'Crimson Mist',
                'key': 'chris-premades.CPR Item Features',
                'uniqueName': 'crimsonMist'
            }
        ]
    };
    let item = await fromUuid(uuid);
    if (!item) return;
    await item.update(updates);
}