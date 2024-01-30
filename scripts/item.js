import {constants} from './constants.js';
import {chris} from './helperFunctions.js';
import {scale} from './scale.js';
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
    let item = app.object;
    if (!item) return;
    let source = item.flags['chris-premades']?.info?.source;
    function cpr(item) {
        let automation = CONFIG.chrisPremades.automations[item.flags['chris-premades']?.info?.name ?? getItemName(item.name)];
        if (!automation) return false;
        let itemVersion = item.flags['chris-premades']?.info?.version;
        if (!itemVersion) {
            headerButton.style.color = 'yellow';
            return true;
        }
        if (automation.version != itemVersion) {
            headerButton.style.color = 'red';
            return true;
        }
        if (CONFIG.chrisPremades.itemConfiguration[automation.name]) {
            headerButton.style.color = 'dodgerblue';
            return true;
        } else {
            headerButton.style.color = 'green';
            return true;
        }
    }
    function gpr(item) {
        let automation = CONFIG['gambits-premades']?.automations[item.name];
        if (!automation) return;
        let itemVersion = item.flags['chris-premades']?.info?.gambit?.version;
        if (!itemVersion) {
            headerButton.style.color = 'yellow';
            return;
        }
        if (automation.version != itemVersion) {
            headerButton.style.color = 'orange';
            return;
        }
        headerButton.style.color = 'orchid';
    }
    function misc(item) {
        let automation = CONFIG['midi-item-showcase-community']?.automations[item.name];
        if (!automation) return;
        let itemVersion = item.flags['chris-premades']?.info?.misc?.version;
        if (!itemVersion) {
            headerButton.style.color = 'yellow';
            return;
        }
        if (automation.version != itemVersion) {
            headerButton.style.color = 'orange';
            return;
        }
        headerButton.style.color = 'orchid';
    }
    if (source) {
        switch(source) {
            case 'CPR':
                cpr(item);
                return;
            case 'GPR':
                gpr(item);
                return;
            case 'MISC':
                misc(item);
                return;
            default:
                headerButton.style.color = 'yellow';
                return;
        }
    } else {
        let found = cpr(item);
        if (found) return;
        let automation = CONFIG['gambits-premades']?.automations[item.name] ?? CONFIG['midi-item-showcase-community']?.automations[item.name];
        if (automation) headerButton.style.color = 'yellow';
    }
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
            'speaker': {'alias': 'Chris\'s Premades'},
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
    if (replacerAccess && configurationAccess) {
        let options = [['🔎 Update / Replace Item', 'update']];
        if (configuration) options.push(['🛠️ Configure', 'configure']);
        if (itemDocument.type === 'class' || itemDocument.type === 'subclass') {
            let identifier = itemDocument.system.identifier;
            if (scale.scaleData[identifier]) options.push(['⚖️ Add Scale', 'scale']);
        }
        let selection = await chris.dialog('Item Configuration: ' + itemDocument.name, options);
        if (!selection) return;
        if (selection === 'update') {
            await updateItem(itemDocument);
        } else if (selection === 'configure') {
            await configureItem(itemDocument, configuration);
        } else if (selection === 'scale') {
            await scale.addScale(itemDocument);
        }
    } else if (replacerAccess && (!configurationAccess || !configuration)) {
        if (itemDocument.type === 'class' || itemDocument.type === 'subclass') {
            let identifier = itemDocument.system.identifier;
            if (scale.scaleData[identifier]) {
                let options = [['🔎 Update / Replace Item', 'update'], ['⚖️ Add Scale', 'scale']];
                let selection = await chris.dialog('Item Configuration: ' + itemDocument.name, options);
                if (!selection) return;
                if (selection === 'update') {
                    await updateItem(itemDocument);
                } else if (selection === 'scale') {
                    await scale.addScale(itemDocument);
                }
            }
        } else {
            await updateItem(itemDocument);
        }
    } else if (!replacerAccess && configurationAccess && configuration) {
        await configureItem(itemDocument, configuration);
    } else {
        ui.notifications.info('Nothing to do!');
    }
}
async function updateItem(itemDocument) {
    let additionalCompendiums = game.settings.get('chris-premades', 'Additional Compendiums');
    let additionalCompendiumPriority = game.settings.get('chris-premades', 'Additional Compendium Priority');
    let flagName = itemDocument.flags?.['chris-premades']?.info?.name;
    let automation = CONFIG.chrisPremades.automations[flagName ?? itemDocument.name];
    let itemName = itemDocument.name;
    if (automation && flagName) itemName = flagName;
    let itemType = itemDocument.type;
    let searchCompendiums = [];
    let isNPC = false;
    if (itemDocument.actor.type === 'npc') isNPC = true;
    let compendiumItem;
    let foundCompendiumName;
    let gambitItems = game.modules.get('gambits-premades')?.active ? game.settings.get('chris-premades', 'GPR Support') : false;
    let miscItems = game.modules.get('midi-item-showcase-community')?.active ? game.settings.get('chris-premades', 'MISC Support') : false;
    itemName = getItemName(itemName);
    let sourceModule;
    if (!isNPC || itemType === 'spell') {
        switch (itemType) {
            case 'weapon':
            case 'equipment':
            case 'consumable':
            case 'tool':
            case 'backpack':
            case 'loot':
                searchCompendiums.push('chris-premades.CPR Items');
                if (gambitItems) searchCompendiums.push('gambits-premades.gps-items');
                if (gambitItems === 2) searchCompendiums.push('gambits-premades.gps-homebrew-items');
                if (miscItems) searchCompendiums.push('midi-item-showcase-community.misc-items');
                if (miscItems === 2 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-homebrew');
                if (miscItems === 1 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-unearthed-arcana');
                break;
            case 'spell':
                searchCompendiums.push('chris-premades.CPR Spells');
                if (gambitItems) searchCompendiums.push('gambits-premades.gps-spells');
                if (miscItems) searchCompendiums.push('midi-item-showcase-community.misc-spells');
                if (miscItems === 2 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-homebrew');
                if (miscItems === 1 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-unearthed-arcana');
                break;
            case 'feat':
                searchCompendiums.push('chris-premades.CPR Race Features');
                searchCompendiums.push('chris-premades.CPR Class Features');
                searchCompendiums.push('chris-premades.CPR Feats');
                searchCompendiums.push('chris-premades.CPR Actions');
                if (gambitItems) {
                    searchCompendiums.push('gambits-premades.gps-class-features');
                    searchCompendiums.push('gambits-premades.gps-generic-features');
                    if (gambitItems === 2) searchCompendiums.push('gambits-premades.gps-homebrew-features');
                }
                if (miscItems) {
                    searchCompendiums.push('midi-item-showcase-community.misc-class-features');
                    searchCompendiums.push('midi-item-showcase-community.misc-feats');
                    searchCompendiums.push('midi-item-showcase-community.misc-race-features');
                    if (miscItems === 2 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-homebrew');
                    if (miscItems === 1 || miscItems === 4) searchCompendiums.push('midi-item-showcase-community.misc-unearthed-arcana');
                }
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
        let gambitPacks = [];
        if (gambitItems && game.modules.get('gambits-premades')?.active) gambitPacks = Array.from(game.modules.get('gambits-premades').packs).map(i => i.id)
        let miscPacks = [];
        if (miscItems && game.modules.get('midi-item-showcase-community')?.active) miscPacks = Array.from(game.modules.get('midi-item-showcase-community').packs).map(i => i.id);
        searchCompendiums.sort((a, b) => {
            let numA = additionalCompendiumPriority[a] ?? 10;
            let numB = additionalCompendiumPriority[b] ?? 10;
            if (packs.includes(a)) numA = additionalCompendiumPriority['CPR'];
            if (packs.includes(b)) numB = additionalCompendiumPriority['CPR'];
            if (gambitPacks.includes(a)) numA = additionalCompendiumPriority['GPR'];
            if (gambitPacks.includes(b)) numB = additionalCompendiumPriority['GPR'];
            if (miscPacks.includes(a)) numA = additionalCompendiumPriority['MISC'];
            if (miscPacks.includes(b)) numB = additionalCompendiumPriority['MISC'];
            return numA - numB;
        });
        for (let compendiumId of searchCompendiums) {
            let compendium = game.packs.get(compendiumId);
            if (!compendium) continue;
            compendiumItem = await chris.getItemFromCompendium(compendiumId, itemName, true);
            if (compendiumItem) {
                foundCompendiumName = compendium.metadata.label;
                sourceModule = compendium.metadata.packageType === 'module' ? compendium.metadata.packageName : 'world';
                break;
            }
        }
    } else if (itemDocument.actor.type === 'npc') {
        let itemActor = itemDocument.actor;
        let monsterName = itemActor.name;
        let sourceActor = game.actors.get(itemActor.id);
        let monsterFolder = game.packs.get('chris-premades.CPR Monster Features').folders.getName(monsterName);
        foundCompendiumName = 'Chris\'s Premades';
        if (sourceActor) monsterName = sourceActor.name;
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
        'speaker': {'alias': 'Chris\'s Premades'},
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
    switch (sourceModule) {
        case 'midi-item-showcase-community':
            setProperty(originalItem, 'flags.chris-premades.info.misc', CONFIG['midi-item-showcase-community']?.automations?.[itemName]);
            setProperty(originalItem, 'flags.chris-premades.info.source', 'MISC');
            break;
        case 'gambits-premades':
            setProperty(originalItem, 'flags.chris-premades.info.gambit', CONFIG['gambits-premades']?.automations?.[itemName]);
            setProperty(originalItem, 'flags.chris-premades.info.source', 'GPR');
            break;
        case 'chris-premades':
            setProperty(originalItem, 'flags.chris-premades.info.source', 'CPR');
            break;
        default:
            setProperty(originalItem, 'flags.chris-premades.info.source', 'world');
            break;
    }
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
                    let current = item.flags['chris-premades']?.configuration?.[key2] ?? value2.default;
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
            'buttons': constants.okCancel
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