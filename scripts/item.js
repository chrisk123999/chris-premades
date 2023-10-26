import {constants} from './constants.js';
import {chris} from './helperFunctions.js';
export function createHeaderButton(config, buttons) {
    if (config.object instanceof Item && config.object?.actor) {
        buttons.unshift({
            'class': 'chris-premades',
            'icon': 'fa-solid fa-kit-medical',
            'onclick': () => itemConfig(config.object)
        });
    }
}
export function updateItemButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.chris-premades');
    if (!headerButton) return;
    let itemName = app.object?.name;
    if (!itemName) return;
    let automation = CONFIG.chrisPremades.automations[app.object.flags['chris-premades']?.info?.name ?? itemName];
    if (!automation) return;
    let itemVersion = app.object.flags['chris-premades']?.info?.version;
    if (!itemVersion) {
        headerButton.style.color = 'yellow';
        return;
    }
    if (automation.version != itemVersion) {
        headerButton.style.color = 'red';
        return;
    }
    headerButton.style.color = 'green';
}
export function createActorHeaderButton(config, buttons) {
    if (config.object instanceof Actor) {
        buttons.unshift({
            class: 'chris-premades',
            icon: 'fa-solid fa-kit-medical',
            onclick: () => actorConfig(config.object)
        });
    }
}
async function actorConfig(actor) {
    if (!(actor.type === 'character' || actor.type === 'npc')) {
        ui.notifications.info('This feature must be used on a character or npc!');
        return;
    }
    let selection = await chris.dialog('Actor Updater', constants.yesNo, 'Apply all of Chris\'s Premades automations to this actor?');
    if (!selection) return;
    let changes = await game.modules.get('ddb-importer').api.chris.adjustActor(actor);
    if (changes && changes?.length) {
        let list = '';
        for (let i of changes.sort()) {
            list += '- ' + i + '<br>'
        }
        ChatMessage.create({
            'speaker': {alias: name},
            'whisper': [game.user.id],
            'content': '<hr><b>Updated Items:</b><br><hr>' + list
        });
    }
    ui.notifications.info('Actor update complete!');
}
async function itemConfig(itemDocument) {
    let replacerAccess = game.user.isGM || game.settings.get('chris-premades', 'Item Replacer Access');
    let configurationAccess = game.user.isGM || game.settings.get('chris-premades', 'Item Configuration Access');
    let configuration = CONFIG.chrisPremades.itemConfiguration[itemDocument.flags?.['chris-premades']?.info?.name ?? itemDocument.name];
    if (replacerAccess && configurationAccess && configuration) {
        let selection = await chris.dialog('Item Configuration: ' + itemDocument.name, [['🔎 Update / Replace', 'update'], ['🛠️ Configure', 'configure']]);
        if (!selection) return;
        if (selection === 'update') {
            await updateItem(itemDocument);
        } else if (selection === 'configure') {
            await configureItem(itemDocument, configuration);
        }
    } else if (replacerAccess && (!configurationAccess || !configuration)) {
        await updateItem(itemDocument);
    } else if (!replacerAccess && configurationAccess && configuration) {
        await configureItem(itemDocument, configuration);
    } else {
        ui.notifications.info('Nothing to do!');
    }
}
async function updateItem(itemDocument) {
    let additionalCompendiums = game.settings.get('chris-premades', 'Additional Compendiums');
    let additionalCompendiumPriority = game.settings.get('chris-premades', 'Additional Compendium Priority');
    let itemName = itemDocument.flags?.['chris-premades']?.info?.name ?? itemDocument.name;
    let itemType = itemDocument.type;
    let searchCompendiums = [];
    let isNPC = false;
    if (itemDocument.actor.type === 'npc') isNPC = true;
    let compendiumItem;
    let foundCompendiumName;
    itemName = getItemName(itemName);
    if (!isNPC || itemType === 'spell') {
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
                searchCompendiums.push('chris-premades.CPR Race Features');
                searchCompendiums.push('chris-premades.CPR Class Features');
                searchCompendiums.push('chris-premades.CPR Feats');
                searchCompendiums.push('chris-premades.CPR Actions');
                break;
        }
        for (let i of additionalCompendiums) searchCompendiums.push(i);
        let packs = [
            'chris-premades.CPR Items',
            'chris-premades.CPR Spells',
            'chris-premades.CPR Race Features',
            'chris-premades.CPR Class Features',
            'chris-premades.CPR Feats',
            'chris-premades.CPR Actions'
        ];
        searchCompendiums.sort((a, b) => (packs.includes(a) ? additionalCompendiumPriority['CPR'] : additionalCompendiumPriority[a] ?? 10) - (packs.includes(b) ? additionalCompendiumPriority['CPR'] : additionalCompendiumPriority[b] ?? additionalCompendiumPriority[b] ?? 10));
        for (let compendium of searchCompendiums) {
            if (!game.packs.get(compendium)) {
                ui.notifications.warn('An invalid compendium key was specified! (' + compendium + ') Check your "Additional Compendiums" setting)');
                continue;
            }
            compendiumItem = await chris.getItemFromCompendium(compendium, itemName, true);
            if (compendiumItem) {
                foundCompendiumName = game.packs.get(compendium).metadata.label;
                break;
            }
        }
    } else if (itemDocument.actor.type === 'npc') {
        let itemActor = itemDocument.actor;
        let monsterName = itemActor.name;
        let sourceActor = game.actors.get(itemActor.id);
        let monsterFolder;
        foundCompendiumName = 'Chris\'s Premades';
        if (sourceActor) monsterName = sourceActor.name;
        if (!isNewerVersion(game.version, '11.293')) {
            if (!game.modules.get('compendium-folders')?.active) {
                ui.notifications.warn('Compendium Folders module is required for this feature in v10!');
                return;
            }
            let folderAPI = game.CF.FICFolderAPI;
            let allFolders = await folderAPI.loadFolders('chris-premades.CPR Monster Features');
            monsterFolder = allFolders.find(f => f.name === monsterName);
        } else {
            monsterFolder = game.packs.get('chris-premades.CPR Monster Features').folders.getName(monsterName);
        }
        if (!monsterFolder) {
            ui.notifications.info('No available automation for this monster! (Or monster has a different name)');
            return;
        }
        compendiumItem = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', itemName, true, monsterFolder.id);
    } else {
        ui.notifications.info('Automation detection for this actor type is not supported!');
    }
    if (!compendiumItem) {
        ui.notifications.info('No available automation! (Or the item has different name)');
        return;
    }
    let selection = await chris.dialog('Item Updater', constants.yesNo, 'Automation found, apply it? (' + foundCompendiumName + ')');
    if (!selection) return;
    ChatMessage.create({
        'speaker': {'alias': name},
        'whisper': [game.user.id],
        'content': '<hr><b>' + compendiumItem.name + ':</b><br><hr>' + compendiumItem.system.description.value
    });
    let originalItem = duplicate(itemDocument.toObject());
    originalItem.name = compendiumItem.name;
    originalItem.effects = compendiumItem.effects;
    originalItem.system = compendiumItem.system;
    let info;
    if (compendiumItem.flags['chris-premades']?.info) info = duplicate(compendiumItem.flags['chris-premades'].info);
    originalItem.system.description = itemDocument.system.description;
    originalItem.system.chatFlavor = itemDocument.system.chatFlavor;
    originalItem.system.uses = itemDocument.system.uses;
    if (itemType === 'spell') {
        originalItem.system.preparation = itemDocument.system.preparation;
    }
    if (itemType != 'spell' || itemType != 'feat') {
        originalItem.system.attunement = itemDocument.system.attunement;
        originalItem.system.equipped = itemDocument.system.equipped;
    }
    if (itemDocument.system.quantity) originalItem.system.quantity = itemDocument.system.quantity;
    originalItem.flags = compendiumItem.flags;
    if (itemDocument.flags['tidy5e-sheet']?.favorite) originalItem.flags['tidy5e-sheet'] = {
        'favorite': true
    }
    if (itemDocument.flags['custom-character-sheet-sections']?.sectionName) originalItem.flags['custom-character-sheet-sections'] = {
        'sectionName': itemDocument.flags['custom-character-sheet-sections'].sectionName
    }
    if (itemDocument.flags.ddbimporter) originalItem.flags.ddbimporter = itemDocument.flags.ddbimporter;
    if (itemDocument.flags['chris-premades']) originalItem.flags['chris-premades'] = itemDocument.flags['chris-premades'];
    if (info) setProperty(originalItem, 'flags.chris-premades.info', info);
    if (originalItem.img === 'icons/svg/item-bag.svg') originalItem.img = compendiumItem.img; 
    await itemDocument.actor.createEmbeddedDocuments('Item', [originalItem]);
    await itemDocument.delete();
    ui.notifications.info('Item updated!');
}
async function configureItem(item, configuration) {
    function dialogRender(html) {
        let ths = html[0].getElementsByTagName('th');
        for (let t of ths) {
            t.style.width = 'auto';
            t.style.textAlign = 'left';
        }
        let tds = html[0].getElementsByTagName('td');
        for (let t of tds) {
            t.style.width = '200px';
            t.style.textAlign = 'right';
            t.style.paddingRight = '5px';
        }
    }
    let buttons = [,
        {
            'label': 'Cancel',
            'value': false
        },
        {
            'label': 'Ok',
            'value': true
        }
    ];
    let generatedMenu = [];
    let inputKeys = [];
    for (let [key, value] of Object.entries(configuration)) {
        switch (key) {
            case 'checkbox':
            case 'text':
            case 'number':
                for (let [key2, value2] of Object.entries(value)) {
                    generatedMenu.push({
                        'label': value2.label,
                        'type': key,
                        'options': item.flags['chris-premades']?.configuration?.[key2] ?? value2.default
                    });
                    inputKeys.push('flags.chris-premades.configuration.' + key2);
                }
                break;
            case 'select':
                for (let [key2, value2] of Object.entries(value)) {
                    let current = item.flags['chris-premades']?.configuration?.[key2];
                    let options = foundry.utils.duplicate(value2.values);
                    options.forEach(item => {
                        if (item.value === current) {
                            item.selected = true;
                        }
                      });
                    generatedMenu.push({
                        'label': value2.label,
                        'type': 'select',
                        'options': options
                    });
                    inputKeys.push('flags.chris-premades.configuration.' + key2);
                }
                break;
        }
    }
    let config = {
        'title': 'Configure: ' + item.name,
        'render': dialogRender
    }
    let selection = await warpgate.menu(
        {
            'inputs': generatedMenu,
            'buttons': buttons
        },
        config
    );
    if (!selection.buttons) return;
    let updates = {};
    for (let i = 0; i < inputKeys.length; i++) {
        if (selection.inputs[i] === '-') continue;
        setProperty(updates, inputKeys[i], selection.inputs[i]);
    }
    await item.update(updates);
}
export function getItemName(itemName) {
    return CONFIG.chrisPremades.renamedItems[itemName] ?? itemName;
}