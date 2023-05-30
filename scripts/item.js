import {chris} from './helperFunctions.js';
export function createHeaderButton(config, buttons) {
    if (config.object instanceof Item) {
        buttons.unshift({
            class: 'chris-premades',
            icon: 'fa-solid fa-kit-medical',
            onclick: () => itemConfig(config.object)
        });
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
    let selection = await chris.dialog('Apply all of Chris\'s automations to this actor?', [['Yes', true], ['No', false]]);
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
    if (!itemDocument.actor) {
        ui.notifications.info('This feature must be used on an item that is on an actor!');
        return;
    }
    let additionalCompendiumString = game.settings.get('chris-premades', 'Additional Compendiums');
    let additionalCompendiums = additionalCompendiumString.split(', ');
    let itemName = itemDocument.name;
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
                break;
        }
        if (game.settings.get('chris-premades', 'Use Additional Compendiums')) {
            for (let i of additionalCompendiums) {
                searchCompendiums.push(i);
            }
        }
        for (let compendium of searchCompendiums) {
            if (!game.packs.get(compendium)) {
                ui.notifications.warn('And invalid compendium key was specified! (Check your "Additional Compendiums" setting)');
                continue;
            }
            compendiumItem = await chris.getItemFromCompendium(compendium, itemName, true);
            if (compendiumItem) {
                foundCompendiumName = game.packs.get(compendium).metadata.label;
                break;
            }
        }
    } else if (itemDocument.actor.type === 'npc') {
        let folderAPI = game.CF.FICFolderAPI;
        let allFolders = await folderAPI.loadFolders('chris-premades.CPR Monster Features');
        let itemActor = itemDocument.actor;
        let monsterName = itemActor.name;
        let sourceActor = game.actors.get(itemActor.id);
        if (sourceActor) monsterName = sourceActor.name;
        let monsterFolder = allFolders.find(f => f.name === monsterName);
        if (!monsterFolder) {
            ui.notifications.info('No available automation for this monster! (Or monster has a different name)');
            return;
        }
        compendiumItem = await chris.getItemFromCompendium('chris-premades.CPR Monster Features', itemName, true, monsterFolder.id);
        foundCompendiumName = 'Chris\'s Premades';
    } else {
        ui.notifications.info('Automation detection for this actor type is not supported!');
    }
    if (!compendiumItem) {
        ui.notifications.info('No available automation! (Or the item has different name)');
        return;
    }
    let options = [
        ['Yes', true],
        ['No', false]
    ];
    let selection = await chris.dialog('Automation found, apply it? (' + foundCompendiumName + ')', options);
    if (!selection) return;
    ChatMessage.create({
        'speaker': {alias: name},
        'whisper': [game.user.id],
        'content': '<hr><b>' + compendiumItem.name + ':</b><br><hr>' + compendiumItem.system.description.value
    });
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
export function getItemName(itemName) {
    return CONFIG.chrisPremades.renamedItems[itemName] ?? itemName;
}
export function setConfig() {
    setProperty(CONFIG, 'chrisPremades', {
        'module': 'chris-premades',
        'renamedItems': {
            'Form of Dread: Transform': 'Form of Dread',
            'Form of Dread': 'Form of Dread: Fear',
            'Ring of Spell Storing': 'Ring of Spell Storing (0/5)',
            'Mutagencraft - Consume Mutagen': 'Mutagencraft - Create Mutagen',
            'Reaper: Chill Touch': 'Reaper',
            'Reaper: Sapping Sting': 'Reaper',
            'Reaper: Spare the Dying': 'Reaper',
            'Reaper: Toll the Dead': 'Reaper'
        },
        'additionalItems': {
            'Blade Flourish': [
                'Blade Flourish Movement'
            ],
            'Arcane Armor': [
                'Arcane Armor: Guardian Model',
                'Arcane Armor: Infiltrator Model'
            ],
            'Eladrin Season: Autumn': [
                'Change Season'
            ],
            'Eladrin Season: Winter': [
                'Change Season'
            ],
            'Eladrin Season: Spring': [
                'Change Season'
            ],
            'Eladrin Season: Summer': [
                'Change Season'
            ]
        },
        'removedItems': {
            'Arcane Armor': [
                'Guardian Armor: Thunder Gauntlets',
                'Guardian Armor: Thunder Gauntlets (STR)',
                'Guardian Armor: Defensive Field',
                'Infiltrator Armor: Lightning Launcher',
                'Infiltrator Armor: Lightning Launcher (DEX)'
            ],
            'Eladrin Season: Autumn': [
                'Fey Step (Autumn)'
            ],
            'Eladrin Season: Winter': [
                'Fey Step (Winter)'
            ],
            'Eladrin Season: Spring': [
                'Fey Step (Spring)'
            ],
            'Eladrin Season: Summer': [
                'Fey Step (Summer)'
            ],
            'Starry Form': [
                'Starry Form: Archer',
                'Starry Form: Chalice',
                'Starry Form: Dragon'
            ]
        },
        'restrictedItems': {
            'Bardic Inspiration 1': {
                originalName: 'Bardic Inspiration',
                requiredClass: 'Bard',
                requiredSubclass: null,
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [
                    'Magical Inspiration'
                ],
                replacedItemName: 'Bardic Inspiration & Magical Inspiration',
                removedItems: [],
                additionalItems: [],
                priority: 0
            },
            'Bardic Inspiration 2': {
                originalName: 'Bardic Inspiration',
                requiredClass: 'Bard',
                requiredSubclass: 'College of Creation',
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [
                    'Magical Inspiration',
                    'Mote of Potential'
                ],
                replacedItemName: 'Bardic Inspiration, Magical Inspiration, & Mote of Potential',
                removedItems: [],
                additionalItems: [],
                priority: 1
            },
            'Radiant Soul': {
                originalName: 'Radiant Soul',
                requiredClass: 'Warlock',
                requiredSubclass: 'The Celestial',
                requiredRace: null,
                requiredEquipment: [],
                requiredFeatures: [],
                replacedItemName: 'Radiant Soul',
                removedItems: [],
                additionalItems: [],
                priority: 0
            }
        }
    });
}