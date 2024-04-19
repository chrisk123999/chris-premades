import {constants} from './constants.js';
import {chris} from './helperFunctions.js';
import {artifactProperties} from './macros/mechanics/artifactProperties.js';
import {flatAttack} from './macros/mechanics/flatAttack.js';
import {scale} from './scale.js';
export function createHeaderButton(config, buttons) {
    if (config.object instanceof Item && config.object?.actor) {
        buttons.unshift({
            'class': 'chris-premades-item',
            'icon': 'fa-solid fa-kit-medical',
            'onclick': () => itemConfig(config.object)
        });
    }
}
export async function updateItemButton(app, [elem], options) {
    let headerButton = elem.closest('.window-app').querySelector('a.header-button.chris-premades-item');
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
    async function gps(item) {
        let automation = await game.modules.get('gambits-premades')?.medkitApi()?.automations?.[item.name];
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
        let automation = CONFIG['midi-item-showcase-community']?.automations?.[item.name];
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
            case 'GPS':
                await gps(item);
                return;
            case 'MISC':
                misc(item);
                return;
            default:
                headerButton.style.color = 'pink';
                return;
        }
    } else {
        let found = cpr(item);
        if (found) return;
        let gambitAutomation;
        let miscAutomation = CONFIG['midi-item-showcase-community']?.automations?.[item.name];
        if (game.modules.get('gambits-premades')?.active)  gambitAutomation = await game.modules.get('gambits-premades')?.medkitApi()?.automations?.[item.name]; 
        if (gambitAutomation || miscAutomation) headerButton.style.color = 'yellow';
    }
}
export function createActorHeaderButton(config, buttons) {
    if (config.object instanceof Actor) {
        buttons.unshift({
            class: 'chris-premades-actor',
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
            list += '- ' + i + '<br>';
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
        let validTypes = ['weapon', 'equipment'];
        if (game.user.isGM && validTypes.includes(itemDocument.type)) options.push(['⚡ Add Artifact Property', 'artifact']);
        if (game.user.isGM && constants.attacks.includes(itemDocument.system.actionType) && game.settings.get('chris-premades', 'Flat Attack Bonus')) options.push(['🗡️ Configure Flat Attack Bonus', 'flatAttack']);
        let selection = await chris.dialog('Item Configuration: ' + itemDocument.name, options);
        if (!selection) return;
        switch (selection) {
            case 'update':
                await updateItem(itemDocument);
                break;
            case 'scale':
                await scale.addScale(itemDocument);
                break;
            case 'artifact':
                await artifactProperties.selectOrRollProperty(itemDocument);
                break;
            case 'flatAttack':
                await flatAttack.menu(itemDocument);
                break;
            case 'configure':
                await configureItem(itemDocument, configuration);
                break;
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
export async function updateItem(itemDocument) {
    let flagName = itemDocument.flags?.['chris-premades']?.info?.name;
    let automation = CONFIG.chrisPremades.automations[flagName ?? itemDocument.name];
    let itemName = automation && flagName ? flagName : itemDocument.name;
    itemName = getItemName(itemName);
    let itemType = itemDocument.type;
    let isNPC = itemDocument.actor?.type === 'npc';
    let compendiumItem;
    let foundCompendiumName;
    let sourceModule;
    if (!isNPC || itemType === 'spell') {
        let searchCompendiums = await chris.getSearchCompendiums(itemType);
        for (let compendiumId of searchCompendiums) {
            let compendium = game.packs.get(compendiumId);
            if (!compendium) continue;
            compendiumItem = await chris.getItemFromCompendium(compendiumId, itemName, true);
            if (compendiumItem) {
                console.log(duplicate(compendiumItem));
                foundCompendiumName = compendium.metadata.label;
                sourceModule = compendium.metadata.packageType === 'module' ? compendium.metadata.packageName : 'world';
                break;
            }
        }
    } else if (isNPC) {
        let itemActor = itemDocument.actor;
        let monsterName = itemActor.name;
        let monsterFolder = game.packs.get('chris-premades.CPR Monster Features').folders.getName(monsterName);
        foundCompendiumName = "Chris's Premades";
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
    if (itemDocument.system.quantity) {
        originalItem.system.quantity = itemDocument.system.quantity;
    }
    originalItem.flags = compendiumItem.flags;
    if (itemDocument.flags['tidy5e-sheet']?.favorite) {
        originalItem.flags['tidy5e-sheet'] = {
            'favorite': true
        };
    }
    if (itemDocument.flags['custom-character-sheet-sections']?.sectionName) {
        originalItem.flags['custom-character-sheet-sections'] = {
            'sectionName': itemDocument.flags['custom-character-sheet-sections'].sectionName
        };
    }
    if (itemDocument.flags.ddbimporter) {
        originalItem.flags.ddbimporter = itemDocument.flags.ddbimporter;
    }
    let info;
    if (compendiumItem.flags['chris-premades']?.info) info = duplicate(compendiumItem.flags['chris-premades'].info);
    if (itemDocument.flags['chris-premades']) originalItem.flags['chris-premades'] = itemDocument.flags['chris-premades'];
    if (info) setProperty(originalItem, 'flags.chris-premades.info', info);
    switch (sourceModule) {
        case 'midi-item-showcase-community': {
            let miscAutomation = CONFIG['midi-item-showcase-community']?.automations?.[itemName];
            setProperty(originalItem, 'flags.chris-premades.info.misc', miscAutomation);
            setProperty(originalItem, 'flags.chris-premades.info.source', 'MISC');
            break;
        }
        case 'gambits-premades': {
            let gambitAutomation = await game.modules.get('gambits-premades')?.medkitApi()?.automations?.[itemName]; 
            setProperty(originalItem, 'flags.chris-premades.info.gambit', gambitAutomation);
            setProperty(originalItem, 'flags.chris-premades.info.source', 'GPS');
            break;
        }
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
    function browseFiles(event) {
        async function updateText(path) {
            event.target.value = path;
        }
        new FilePicker({'type': 'image', callback: updateText}).render();
    }
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
        if (game.permissions.FILES_BROWSE.includes(game.user.role) || game.user.isGM) {
            let inputs = html[0].getElementsByTagName('input');
            for (let i of files) inputs[i].addEventListener('click', browseFiles);
        }
    }
    let generatedMenu = [];
    let inputKeys = [];
    let files = [];
    for (let [key, value] of Object.entries(configuration)) {
        switch (key) {
            case 'checkbox':
            case 'text':
            case 'number':
                for (let [key2, value2] of Object.entries(value)) {
                    if (value2.file) files.push(generatedMenu.length);
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
                    let options = duplicate(value2.values);
                    options.forEach(item => {
                        if (item.value === current) item.selected = true;
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
    };
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
    if (configuration.callback) await configuration.callback(item, updates);
}
export function getItemName(itemName) {
    return CONFIG.chrisPremades.renamedItems[itemName] ?? itemName;
}
