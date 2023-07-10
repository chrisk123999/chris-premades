import {chris} from './helperFunctions.js';
export function createHeaderButton(config, buttons) {
    if (config.object instanceof Item && config.object?.actor) {
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
    let replacerAccess = game.user.isGM || game.settings.get('chris-premades', 'Item Replacer Access');
    let configurationAccess = game.user.isGM || game.settings.get('chris-premades', 'Item Configuration Access');
    let configuration = CONFIG.chrisPremades.itemConfiguration[itemDocument.name];
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
    if (itemDocument.flags['chris-premades']) originalItem.flags['chris-premades'] = itemDocument.flags['chris-premades'];
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
                    generatedMenu.push({
                        'label': value2.label,
                        'type': 'select',
                        'options': [{'value': '-', 'html': '-'}].concat(value2.values)
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
            'Animating Performance': [
                'Animating Performance: Animate',
                'Animating Performance: Dancing Item'
            ],
            'Arcane Armor': [
                'Guardian Armor: Thunder Gauntlets',
                'Guardian Armor: Thunder Gauntlets (STR)',
                'Guardian Armor: Defensive Field',
                'Infiltrator Armor: Lightning Launcher',
                'Infiltrator Armor: Lightning Launcher (DEX)'
            ],
            'Blessing of the Raven Queen': [
                'Blessing of the Raven Queen (Resistance)'
            ],
            'Drake Companion: Summon': [
                'Bond of Fang and Scale: Acid Resistance',
                'Bond of Fang and Scale: Cold Resistance',
                'Bond of Fang and Scale: Fire Resistance',
                'Bond of Fang and Scale: Lightning Resistance',
                'Bond of Fang and Scale: Poison Resistance',
                'Drake Companion',
                'Drake Companion: Command',
                'Drake Companion: Drake Companion (Acid)',
                'Drake Companion: Drake Companion (Cold)',
                'Drake Companion: Drake Companion (Fire)',
                'Drake Companion: Drake Companion (Lightning)',
                'Drake Companion: Drake Companion (Poison)',
                'Reflexive Resistance',
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
            'Metamagic - Careful Spell': [
                'Metamagic: Careful Spell'
            ],
            'Metamagic - Distant Spell': [
                'Metamagic: Distant Spell'
            ],
            'Metamagic - Empowered Spell': [
                'Metamagic: Empowered Spell'
            ],
            'Metamagic - Extended Spell': [
                'Metamagic: Extended Spell'
            ],
            'Metamagic - Heightened Spell': [
                'Metamagic: Heightened Spell'
            ],
            'Metamagic - Quickened Spell': [
                'Metamagic: Quickened Spell'
            ],
            'Metamagic - Subtle Spell': [
                'Metamagic: Subtle Spell'
            ],
            'Metamagic - Transmuted Spell': [
                'Metamagic: Transmuted Spell'
            ],
            'Metamagic - Twinned Spell': [
                'Metamagic: Twinned Spell'
            ],
            'Starry Form': [
                'Starry Form: Archer',
                'Starry Form: Chalice',
                'Starry Form: Dragon'
            ],
            'Summon Wildfire Spirit': [
                'Summon Wildfire Spirit: Command'
            ],
            'Tentacle of the Deeps: Summon': [
                'Tentacle of the Deeps: Move',
                'Tentacle of the Deeps: Attack'
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
        },
        'correctedItems': {
            'Metamagic - Careful Spell': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
            'Metamagic - Empowered Spell': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
            'Metamagic - Heightened Spell': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
            'Metamagic - Seeking Spell': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
            'Metamagic - Transmuted Spell': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
            'Metamagic - Twinned Spell': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
            'Steel Defender': {
                'system': {
                    'uses': {
                        'max': 1,
                        'per': 'lr',
                        'recovery': '',
                        'value': 1
                    }
                }
            },
            'Summon Wildfire Spirit': {
                'system': {
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': '',
                    }
                }
            },
        },
        'itemConfiguration': {
            'Magic Missile': {
                'checkbox': {
                    'homebrew': {
                        'label': 'Roll multiple dice?',
                        'default': false
                    }
                },
                'select': {
                    'color': {
                        'label': 'What color?',
                        'default': 'purple',
                        'values': [
                            {'value': 'white', 'html': 'White'},
                            {'value': 'red', 'html': 'Red'},
                            {'value': 'orange', 'html': 'Orange'},
                            {'value': 'yellow', 'html': 'Yellow'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'purple', 'html': 'Purple'},
                            {'value': 'cycle', 'html': 'Cycle'},
                            {'value': 'random', 'html': 'Random'}
                        ]
                    }
                }
            },
            'Healing Spirit': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Summon Aberration': {
                'text': {
                    'name-beholderkin': {
                        'label': 'Beholderkin Custom Name:',
                        'default': ''
                    },
                    'token-beholderkin': {
                        'label': 'Beholderkin Token:',
                        'default': ''
                    },
                    'avatar-beholderkin': {
                        'label': 'Beholderkin Avatar:',
                        'default': ''
                    },
                    'name-slaad': {
                        'label': 'Slaad Custom Name:',
                        'default': ''
                    },
                    'token-slaad': {
                        'label': 'Slaad Token:',
                        'default': ''
                    },
                    'avatar-slaad': {
                        'label': 'Slaad Avatar:',
                        'default': ''
                    },
                    'name-star-spawn': {
                        'label': 'Star Spawn Custom Name:',
                        'default': ''
                    },
                    'token-star-spawn': {
                        'label': 'Star Spawn Token:',
                        'default': ''
                    },
                    'avatar-star-spawn': {
                        'label': 'Star Spawn Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Beast': {
                'text': {
                    'name-air': {
                        'label': 'Air Custom Name:',
                        'default': ''
                    },
                    'token-air': {
                        'label': 'Air Token:',
                        'default': ''
                    },
                    'avatar-air': {
                        'label': 'Air Avatar:',
                        'default': ''
                    },
                    'name-land': {
                        'label': 'Land Custom Name:',
                        'default': ''
                    },
                    'token-land': {
                        'label': 'Land Token:',
                        'default': ''
                    },
                    'avatar-land': {
                        'label': 'Land Avatar:',
                        'default': ''
                    },
                    'name-water': {
                        'label': 'Water Custom Name:',
                        'default': ''
                    },
                    'token-water': {
                        'label': 'Water Token:',
                        'default': ''
                    },
                    'avatar-water': {
                        'label': 'Water Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Celestial': {
                'text': {
                    'name-avenger': {
                        'label': 'Avenger Custom Name:',
                        'default': ''
                    },
                    'token-avenger': {
                        'label': 'Avenger Token:',
                        'default': ''
                    },
                    'avatar-air': {
                        'label': 'Avenger Avatar:',
                        'default': ''
                    },
                    'name-defender': {
                        'label': 'Defender Custom Name:',
                        'default': ''
                    },
                    'token-defender': {
                        'label': 'Defender Token:',
                        'default': ''
                    },
                    'avatar-defender': {
                        'label': 'Defender Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Construct': {
                'text': {
                    'name-clay': {
                        'label': 'Clay Custom Name:',
                        'default': ''
                    },
                    'token-clay': {
                        'label': 'Clay Token:',
                        'default': ''
                    },
                    'avatar-clay': {
                        'label': 'Clay Avatar:',
                        'default': ''
                    },
                    'name-metal': {
                        'label': 'Metal Custom Name:',
                        'default': ''
                    },
                    'token-metal': {
                        'label': 'Metal Token:',
                        'default': ''
                    },
                    'avatar-metal': {
                        'label': 'Metal Avatar:',
                        'default': ''
                    },
                    'name-stone': {
                        'label': 'Stone Custom Name:',
                        'default': ''
                    },
                    'token-stone': {
                        'label': 'Stone Token:',
                        'default': ''
                    },
                    'avatar-stone': {
                        'label': 'Stone Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Draconic Spirit': {
                'text': {
                    'name-chromatic': {
                        'label': 'Chromatic Custom Name:',
                        'default': ''
                    },
                    'token-chromatic': {
                        'label': 'Chromatic Token:',
                        'default': ''
                    },
                    'avatar-chromatic': {
                        'label': 'Chromatic Avatar:',
                        'default': ''
                    },
                    'name-metallic': {
                        'label': 'Metallic Custom Name:',
                        'default': ''
                    },
                    'token-metallic': {
                        'label': 'Metallic Token:',
                        'default': ''
                    },
                    'avatar-metallic': {
                        'label': 'Metallic Avatar:',
                        'default': ''
                    },
                    'name-gem': {
                        'label': 'Gem Custom Name:',
                        'default': ''
                    },
                    'token-gem': {
                        'label': 'Gem Token:',
                        'default': ''
                    },
                    'avatar-gem': {
                        'label': 'Gem Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Elemental': {
                'text': {
                    'name-air': {
                        'label': 'Air Custom Name:',
                        'default': ''
                    },
                    'token-air': {
                        'label': 'Air Token:',
                        'default': ''
                    },
                    'avatar-air': {
                        'label': 'Air Avatar:',
                        'default': ''
                    },
                    'name-earth': {
                        'label': 'Earth Custom Name:',
                        'default': ''
                    },
                    'token-earth': {
                        'label': 'Earth Token:',
                        'default': ''
                    },
                    'avatar-earth': {
                        'label': 'Earth Avatar:',
                        'default': ''
                    },
                    'name-fire': {
                        'label': 'Fire Custom Name:',
                        'default': ''
                    },
                    'token-fire': {
                        'label': 'Fire Token:',
                        'default': ''
                    },
                    'avatar-fire': {
                        'label': 'Fire Avatar:',
                        'default': ''
                    },
                    'name-water': {
                        'label': 'Water Custom Name:',
                        'default': ''
                    },
                    'token-water': {
                        'label': 'Water Token:',
                        'default': ''
                    },
                    'avatar-water': {
                        'label': 'Water Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Fey': {
                'text': {
                    'name-fuming': {
                        'label': 'Fuming Custom Name:',
                        'default': ''
                    },
                    'token-fuming': {
                        'label': 'Fuming Token:',
                        'default': ''
                    },
                    'avatar-fuming': {
                        'label': 'Fuming Avatar:',
                        'default': ''
                    },
                    'name-mirthful': {
                        'label': 'Mirthful Custom Name:',
                        'default': ''
                    },
                    'token-mirthful': {
                        'label': 'Mirthful Token:',
                        'default': ''
                    },
                    'avatar-mirthful': {
                        'label': 'Mirthful Avatar:',
                        'default': ''
                    },
                    'name-tricksy': {
                        'label': 'Tricksy Custom Name:',
                        'default': ''
                    },
                    'token-tricksy': {
                        'label': 'Tricksy Token:',
                        'default': ''
                    },
                    'avatar-tricksy': {
                        'label': 'Tricksy Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Fiend': {
                'text': {
                    'name-demon': {
                        'label': 'Demon Custom Name:',
                        'default': ''
                    },
                    'token-demon': {
                        'label': 'Demon Token:',
                        'default': ''
                    },
                    'avatar-demon': {
                        'label': 'Demon Avatar:',
                        'default': ''
                    },
                    'name-devil': {
                        'label': 'Devil Custom Name:',
                        'default': ''
                    },
                    'token-devil': {
                        'label': 'Devil Token:',
                        'default': ''
                    },
                    'avatar-devil': {
                        'label': 'Devil Avatar:',
                        'default': ''
                    },
                    'name-yugoloth': {
                        'label': 'Yugoloth Custom Name:',
                        'default': ''
                    },
                    'token-yugoloth': {
                        'label': 'Yugoloth Token:',
                        'default': ''
                    },
                    'avatar-yugoloth': {
                        'label': 'Yugoloth Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Shadowspawn': {
                'text': {
                    'name-fury': {
                        'label': 'Fury Custom Name:',
                        'default': ''
                    },
                    'token-fury': {
                        'label': 'Fury Token:',
                        'default': ''
                    },
                    'avatar-fury': {
                        'label': 'Fury Avatar:',
                        'default': ''
                    },
                    'name-despair': {
                        'label': 'Despair Custom Name:',
                        'default': ''
                    },
                    'token-despair': {
                        'label': 'Despair Token:',
                        'default': ''
                    },
                    'avatar-despair': {
                        'label': 'Despair Avatar:',
                        'default': ''
                    },
                    'name-fear': {
                        'label': 'Fear Custom Name:',
                        'default': ''
                    },
                    'token-fear': {
                        'label': 'Fear Token:',
                        'default': ''
                    },
                    'avatar-fear': {
                        'label': 'Fear Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Undead': {
                'text': {
                    'name-ghostly': {
                        'label': 'Ghostly Custom Name:',
                        'default': ''
                    },
                    'token-ghostly': {
                        'label': 'Ghostly Token:',
                        'default': ''
                    },
                    'avatar-ghostly': {
                        'label': 'Ghostly Avatar:',
                        'default': ''
                    },
                    'name-putrid': {
                        'label': 'Putrid Custom Name:',
                        'default': ''
                    },
                    'token-putrid': {
                        'label': 'Putrid Token:',
                        'default': ''
                    },
                    'avatar-putrid': {
                        'label': 'Putrid Avatar:',
                        'default': ''
                    },
                    'name-skeletal': {
                        'label': 'Skeletal Custom Name:',
                        'default': ''
                    },
                    'token-skeletal': {
                        'label': 'Skeletal Token:',
                        'default': ''
                    },
                    'avatar-skeletal': {
                        'label': 'Skeletal Avatar:',
                        'default': ''
                    }
                }
            },
            'Summon Wildfire Spirit': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Bigby\'s Hand': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Animating Performance': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Drake Companion: Summon': {
                'text': {
                    'name-acid': {
                        'label': 'Acid Custom Name:',
                        'default': ''
                    },
                    'token-acid': {
                        'label': 'Acid Token:',
                        'default': ''
                    },
                    'avatar-acid': {
                        'label': 'Acid Avatar:',
                        'default': ''
                    },
                    'name-cold': {
                        'label': 'Cold Custom Name:',
                        'default': ''
                    },
                    'token-cold': {
                        'label': 'Cold Token:',
                        'default': ''
                    },
                    'avatar-cold': {
                        'label': 'Cold Avatar:',
                        'default': ''
                    },
                    'name-fire': {
                        'label': 'Fire Custom Name:',
                        'default': ''
                    },
                    'token-fire': {
                        'label': 'Fire Token:',
                        'default': ''
                    },
                    'avatar-fire': {
                        'label': 'Fire Avatar:',
                        'default': ''
                    },
                    'name-lightning': {
                        'label': 'Lightning Custom Name:',
                        'default': ''
                    },
                    'token-lightning': {
                        'label': 'Lightning Token:',
                        'default': ''
                    },
                    'avatar-lightning': {
                        'label': 'Lightning Avatar:',
                        'default': ''
                    },
                    'name-poison': {
                        'label': 'Poison Custom Name:',
                        'default': ''
                    },
                    'token-poison': {
                        'label': 'Poison Token:',
                        'default': ''
                    },
                    'avatar-poison': {
                        'label': 'Poison Avatar:',
                        'default': ''
                    }
                }
            },
            'Create Homunculus Servant': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Primal Companion': {
                'text': {
                    'name-land': {
                        'label': 'Land Custom Name:',
                        'default': ''
                    },
                    'token-land': {
                        'label': 'Land Token:',
                        'default': ''
                    },
                    'avatar-land': {
                        'label': 'Land Avatar:',
                        'default': ''
                    },
                    'name-sea': {
                        'label': 'Sea Custom Name:',
                        'default': ''
                    },
                    'token-sea': {
                        'label': 'Sea Token:',
                        'default': ''
                    },
                    'avatar-sea': {
                        'label': 'Sea Avatar:',
                        'default': ''
                    },
                    'name-sky': {
                        'label': 'Sky Custom Name:',
                        'default': ''
                    },
                    'token-sky': {
                        'label': 'Sky Token:',
                        'default': ''
                    },
                    'avatar-sky': {
                        'label': 'Sky Avatar:',
                        'default': ''
                    }
                }
            },
            'Tentacle of the Deeps: Summon': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Steel Defender': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Piercer: Reroll Damage': {
                'checkbox': {
                    'auto': {
                        'label': 'Auto Reroll?',
                        'default': false
                    }
                },
                'number': {
                    'reroll': {
                        'label': 'Auto reroll at:',
                        'default': 1
                    }
                }
            },
            'Hybrid Transformation': {
                'text': {
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'Sneak Attack': {
                'checkbox': {
                    'auto': {
                        'label': 'Auto Sneak Attack?',
                        'default': false
                    }
                }
            },
            'Change Season': {
                'checkbox': {
                    'showIcon': {
                        'label': 'Hide effect icon?',
                        'default': false
                    }
                },
                'text': {
                    'token-spring': {
                        'label': 'Spring Token:',
                        'default': ''
                    },
                    'avatar-spring': {
                        'label': 'Spring Avatar:',
                        'default': ''
                    },
                    'token-summer': {
                        'label': 'Summer Token:',
                        'default': ''
                    },
                    'avatar-summer': {
                        'label': 'Summer Avatar:',
                        'default': ''
                    },
                    'token-autumn': {
                        'label': 'Autumn Token:',
                        'default': ''
                    },
                    'avatar-autumn': {
                        'label': 'Autumn Avatar:',
                        'default': ''
                    },
                    'token-winter': {
                        'label': 'Winter Token:',
                        'default': ''
                    },
                    'avatar-winter': {
                        'label': 'Winter Avatar:',
                        'default': ''
                    }
                }
            },
            'Divine Strike': {
                'select': {
                    'damageType': {
                        'label': 'Override damage type?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'acid', 'html': 'Acid'},
                            {'value': 'bludgeoning', 'html': 'Bludgeoning'},
                            {'value': 'cold', 'html': 'Cold'},
                            {'value': 'fire', 'html': 'Fire'},
                            {'value': 'force', 'html': 'Force'},
                            {'value': 'lightning', 'html': 'Lightning'},
                            {'value': 'necrotic', 'html': 'Necrotic'},
                            {'value': 'piercing', 'html': 'Piercing'},
                            {'value': 'poison', 'html': 'Poison'},
                            {'value': 'psychic', 'html': 'Psychic'},
                            {'value': 'radiant', 'html': 'Radiant'},
                            {'value': 'slashing', 'html': 'Slashing'},
                            {'value': 'thunder', 'html': 'Thunder'}
                        ]
                    }
                }
            },
            'Regeneration': {
                'checkbox': {
                    'acid': {
                        'label': 'Acid damage prevents healing?',
                        'default': false
                    },
                    'bludgeoning': {
                        'label': 'Bludgeoning damage prevents healing?',
                        'default': false
                    },
                    'cold': {
                        'label': 'Cold damage prevents healing?',
                        'default': false
                    },
                    'fire': {
                        'label': 'Fire damage prevents healing?',
                        'default': false
                    },
                    'force': {
                        'label': 'Force damage prevents healing?',
                        'default': false
                    },
                    'lightning': {
                        'label': 'Lightning damage prevents healing?',
                        'default': false
                    },
                    'necrotic': {
                        'label': 'Necrotic damage prevents healing?',
                        'default': false
                    },
                    'piercing': {
                        'label': 'Piercing damage prevents healing?',
                        'default': false
                    },
                    'poison': {
                        'label': 'Poison damage prevents healing?',
                        'default': false
                    },
                    'psychic': {
                        'label': 'Psychic damage prevents healing?',
                        'default': false
                    },
                    'radiant': {
                        'label': 'Radiant damage prevents healing?',
                        'default': false
                    },
                    'slashing': {
                        'label': 'Slashing damage prevents healing?',
                        'default': false
                    },
                    'thunder': {
                        'label': 'Thunder damage prevents healing?',
                        'default': false
                    },
                    'critical': {
                        'label': 'Critical hit prevents healing?',
                        'default': false
                    },
                    'zeroHP': {
                        'label': 'Don\'t regenerate at zero HP?',
                        'default': false
                    }
                },
                'number': {
                    'threshold': {
                        'label': 'Reduced healing threshold:',
                        'default': 0
                    }
                }
            },
            'Spirit Guardians': {
                'select': {
                    'color': {
                        'label': 'What color?',
                        'default': 'blueyellow',
                        'values': [
                            {'value': 'blueyellow', 'html': 'Blue-Yellow'},
                            {'value': 'blue.ring', 'html': 'Blue'},
                            {'value': 'dark_black.ring', 'html': 'Black'},
                            {'value': 'dark_blue', 'html': 'Dark Blue'},
                            {'value': 'dark_purple.ring', 'html': 'Purple'},
                            {'value': 'dark_red.ring', 'html': 'Red'},
                            {'value': 'dark_whiteblue.ring', 'html': 'White-Blue'},
                            {'value': 'green.ring', 'html': 'Green'},
                            {'value': 'orange.ring', 'html': 'Orange'},
                            {'value': 'greenorange.ring', 'html': 'Green-Orange'},
                            {'value': 'pinkpurple.ring', 'html': 'Pink-Purple'},
                            {'value': 'random', 'html': 'Random'}
                        ]
                    }
                }
            },
            'Channel Divinity: Turn Undead': {
                'text': {
                    'identifier': {
                        'label': 'Class Identifier:',
                        'default': 'cleric'
                    }
                }
            },
            'Spiritual Weapon': {
                'text': {
                    'name': {
                        'label': 'Custom Name:',
                        'default': ''
                    },
                    'avatar': {
                        'label': 'Custom Avatar:',
                        'default': ''
                    },
                    'token': {
                        'label': 'Custom Token:',
                        'default': ''
                    }
                }
            },
            'CPR - Randomizer': {
                'checkbox': {
                    'humanoid': {
                        'label': 'Random Humanoid:',
                        'default': false
                    }
                },
                'select': {
                    'abilities': {
                        'label': 'Humanoid Ability Merge:',
                        'default': 'upgrade',
                        'values': [
                            {'value': 'source', 'html': 'Keep Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'upgrade', 'html': 'Upgrade'},
                            {'value': 'downgrade', 'html': 'Downgrade'}
                        ]
                    },
                    'skills': {
                        'label': 'Humanoid Skill Merge:',
                        'default': 'upgrade',
                        'values': [
                            {'value': 'source', 'html': 'Keep Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'upgrade', 'html': 'Upgrade'},
                            {'value': 'downgrade', 'html': 'Downgrade'}
                        ]
                    },
                    'avatar': {
                        'label': 'Humanoid Avatar Merge:',
                        'default': 'source',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'}
                        ]
                    },
                    'token': {
                        'label': 'Humanoid Token Merge:',
                        'default': 'source',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'}
                        ]
                    },
                    'features': {
                        'label': 'Feature Merge',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    }
                }
            },
            'Eldritch Blast': {
                'checkbox': {
                    'agonizingblast': {
                        'label': 'Force Apply Agonizing Blast?',
                        'default': false
                    }
                },
                'select': {
                    'color': {
                        'label': 'What color?',
                        'default': 'purple',
                        'values': [
                            {'value': 'dark_green', 'html': 'Dark Green'},
                            {'value': 'dark_red', 'html': 'Red'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'lightblue', 'html': 'Blue'},
                            {'value': 'lightgreen', 'html': 'Light Green'},
                            {'value': 'orange', 'html': 'Orange'},
                            {'value': 'pink', 'html': 'Pink'},
                            {'value': 'yellow', 'html': 'Yellow'},
                            {'value': 'rainbow', 'html': 'Rainbow'},
                            {'value': 'cycle', 'html': 'Cycle'},
                            {'value': 'random', 'html': 'Random'}
                        ]
                    }
                }
            },
        }
    });
}