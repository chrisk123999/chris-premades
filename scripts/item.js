import {chris} from './helperFunctions.js';
export function createHeaderButton(config, buttons) {
    if (!config.object instanceof Item) return;
    buttons.unshift({
        class: 'chris-premades',
        icon: 'fa-solid fa-kit-medical',
        onclick: () => itemConfig(config.object)
    });
}
async function itemConfig(itemDocument) {
    if (!itemDocument.actor) {
        ui.notifications.info('This feature may only be used on owned items.');
        return;
    }
    let itemName = itemDocument.name;
    let itemType = itemDocument.type;
    let searchCompendiums = [];
    switch (itemType) {
        case 'weapon':
        case 'equipment':
        case 'consumable':
        case 'tool':
        case 'backpack':
        case 'loot':
            searchCompendiums.push('chris-premades.CPR Items');
            break;
        case 'spell':
            searchCompendiums.push('chris-premades.CPR Spells');
            break;
        case 'feat':
            if (itemDocument.actor.type === 'character') {
                searchCompendiums.push('chris-premades.CPR Race Features');
                searchCompendiums.push('chris-premades.CPR Class Features');
            } else if (itemDocument.actor.type === 'npc') {
                searchCompendiums.push('chris-premades.CPR Monster Features');
            }
            break;
    }
    switch (itemName) {
        case 'Bardic Inspiration':
            itemName = 'Bardic Inspiration & Magical Inspiration';
            break;
        case 'Form of Dread: Transform':
            itemName = 'Form of Dread';
            break;
        case 'Ring of Spell Storing':
            itemName = 'Ring of Spell Storing (0/5)';
            break;
    }
    let compendiumItem = await chris.getItemFromCompendium(searchCompendiums[0], itemName, true);
    if (!compendiumItem && searchCompendiums.length == 2) compendiumItem = await chris.getItemFromCompendium(searchCompendiums[1], itemName , true);
    if (!compendiumItem) {
        ui.notifications.info('No available automation (Or the item has another name)!');
        return;
    }
    let options = [
        ['Yes', true],
        ['No', false]
    ];
    let selection = await chris.dialog('An automation is available for this, apply it?', options);
    if (!selection) return;
    let originalItem = duplicate(itemDocument.toObject());
    originalItem.name = compendiumItem.name;
    originalItem.effects = compendiumItem.effects;
    originalItem.system = compendiumItem.system;
    originalItem.system.description = itemDocument.system.description;
    originalItem.system.uses = itemDocument.system.uses;
    if (itemType === 'spell') {
        originalItem.system.preparation = itemDocument.system.preparation;
    }
    if (itemType != 'spell' || itemType != 'feat') {
        originalItem.system.attunement = itemDocument.system.attunement;
        originalItem.system.equipped = itemDocument.system.equipped;
    }
    if (itemDocument.system.quantity) originalItem.system.quantity = itemDocument.system.quantity;
    delete(originalItem.flags);
    originalItem.flags = compendiumItem.flags;
    if (itemDocument.flags['tidy5e-sheet']?.favorite) originalItem.flags['tidy5e-sheet'] = {
        'favorite': true
    }
    if (itemDocument.flags['custom-character-sheet-sections']?.sectionName) originalItem.flags['custom-character-sheet-sections'] = {
        'sectionName': itemDocument.flags['custom-character-sheet-sections'].sectionName
    }
    if (itemDocument.flags.ddbimporter) originalItem.flags.ddbimporter = itemDocument.flags.ddbimporter;
    await itemDocument.actor.createEmbeddedDocuments('Item', [originalItem]);
    await itemDocument.delete();
    ui.notifications.info('Item updated!');
}