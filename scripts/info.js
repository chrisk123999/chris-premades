import {chris} from './helperFunctions.js';
export async function info({speaker, actor, token, character, item, args, scope, workflow}) {
    let info = item?.flags?.['chris-premades']?.info;
    if (!info) return;
    let message = '';
    let cancel = false;
    if (info.version) {
        let currentVersion = automations[info.name].version
        let itemVersion = info.version;
        if (isNewerVersion(currentVersion, itemVersion)) {
            message += 'Automation is out of date!<br>Item Version: ' + itemVersion + '<br>Updated Version: ' + currentVersion;
            cancel = true;
        }
    }
    if (info.settings) {
        let missingSettings = [];
        for (let i of info.settings) {
            if (!game.settings.get('chris-premades', i)) missingSettings.push(i);
        }
        if (missingSettings.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following settings to be enabled:';
            for (let i of missingSettings) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (info.mutation) {
        if (info.mutation.self) {
            if (!workflow.token) {
                if (message != '') message += '<hr>';
                message += 'This automation requires your token to be on the scene.';
                cancel = true;
            } else {
                let mutationStack = warpgate.mutationStack(workflow.token.document);
                if (mutationStack.getName(info.mutation.self)) await warpgate.revert(workflow.token.document, info.mutation.self);
                console.warn('A duplicate CPR Warpgate mutation was detected and removed!');
            }
        }
    }
    if (info.actors) {
        let missingActors = [];
        for (let i of info.actors) {
            if (!game.actors.getName(i)) missingActors.push(i);
        }
        if (missingActors.length > 0) {
            if (message != '') message += '<hr>';
            message += 'This automation requires the following sidebar actors:';
            for (let i of missingActors) {
                message += '<br>' + i;
            }
            cancel = true;
        }
    }
    if (cancel) {
        ChatMessage.create({
            'speaker': {alias: name},
            'content': message
        });
        return false;
    }
}
export async function setItemInfo(itemUuid) {
    if (!itemUuid) {
        let selection0 = await warpgate.menu({
            'inputs': [
                {
                    'label': 'Item Uuid:',
                    'type': 'text',
                    'options': ''
                }
            ],
            'buttons': [
                {
                    'label': 'Next',
                    'value': true,
                    'default': true
                }
            ]
        },
        {
            'title': 'Item Uuid'
        });
        if (!selection0.buttons) return;
        itemUuid = selection0.inputs[0];
    }
    let currentVersion = '0.7.01';
    let item = await fromUuid(itemUuid);
    if (!item) return;
    let updates = {};
    setProperty(updates, 'flags.chris-premades.info.name', item.name);
    let selection = await warpgate.menu({
        'inputs': [
            {
                'label': 'Version: ',
                'type': 'text',
                'options': currentVersion
            }
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': item.name + ': Version'
    });
    if (!selection.buttons) return;
    setProperty(updates, 'flags.chris-premades.info.version', selection.inputs[0]);
    let selection2 = await warpgate.menu({
        'inputs': [
            {
                'label': 'Setting 1:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 2:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 3:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 4:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Setting 5:',
                'type': 'text',
                'options': ''
            },
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': item.name + ': Settings'
    });
    if (!selection2.buttons) return;
    let settings = selection2.inputs.filter(i => i != '');
    if (settings.length != 0) {
        setProperty(updates, 'flags.chris-premades.info.settings', settings);
    }
    let selection3 = await warpgate.menu({
        'inputs': [
            {
                'label': 'Self Mutation Name',
                'type': 'text',
                'options': ''
            }
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': item.name + ': Self Mutation'
    });
    if (!selection3.buttons) return;
    if (selection3.inputs[0] != '') setProperty(updates, 'flags.chris-premades.info.mutation.self', selection3.inputs[0]);
    let selection4 = await warpgate.menu({
        'inputs': [
            {
                'label': 'Actor 1:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 2:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 3:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 4:',
                'type': 'text',
                'options': ''
            },
            {
                'label': 'Actor 5:',
                'type': 'text',
                'options': ''
            },
        ],
        'buttons': [
            {
                'label': 'Next',
                'value': true,
                'default': true
            }
        ]
    },
    {
        'title': item.name + ': Actors'
    });
    if (!selection4.buttons) return;
    let actors = selection4.inputs.filter(i => i != '');
    if (actors.length != 0) {
        setProperty(updates, 'flags.chris-premades.info.actors', actors);
    }
    await item.update(updates);
}
export async function setCompendiumItemInfo(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        if (automations[i.name]) {
            await i.setFlag('chris-premades', 'info', automations[i.name]);
        }
    }
}
export let automations = {
    'Armor of Agathys': {
        'name': 'Armor of Agathys',
        'version': '0.7.01',
        'settings': [
            'Armor of Agathys'
        ]
    },
    'Arms of Hadar': {
        'name': 'Arms of Hadar',
        'version': '0.7.01'
    },
    'Aura of Purity': {
        'name': 'Aura of Purity',
        'version': '0.7.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Aura of Vitality': {
        'name': 'Aura of Vitality',
        'version': '0.7.01',
        'mutation': {
            'self': 'Aura of Vitality'
        }
    },
    'Beacon of Hope': {
        'name': 'Beacon of Hope',
        'version': '0.7.01',
        'settings': [
            'Beacon of Hope'
        ]
    },
    'Bestow Curse': {
        'name': 'Bestow Curse',
        'version': '0.7.01',
    },
    'Bigby\'s Hand': {
        'name': 'Bigby\'s Hand',
        'version': '0.7.01',
        'actors': [
            'CPR - Bigby\'s Hand'
        ]
    },
    'Blade Ward': {
        'name': 'Blade Ward',
        'version': '0.7.01'
    },
    'Blight': {
        'name': 'Blight',
        'version': '0.7.01'
    },
    'Blink': {
        'name': 'Blink',
        'version': '0.7.01'
    },
    'Call Lightning': {
        'name': 'Call Lightning',
        'version': '0.7.01',
        'mutation': {
            'self': 'Storm Bolt'
        }
    },
    'Chain Lightning': {
        'name': 'Chain Lightning',
        'version': '0.7.01'
    },
    'Charm Person': {
        'name': 'Charm Person',
        'version': '0.7.01'
    },
    'Chill Touch': {
        'name': 'Chill Touch',
        'version': '0.7.01'
    },
    'Chromatic Orb': {
        'name': 'Chromatic Orb',
        'version': '0.7.01'
    },
    'Cloudkill': {
        'name': 'Cloudkill',
        'version': '0.7.01',
        'settings': [
            'Template Listener'
        ]
    },
    'Crown of Madness': {
        'name': 'Crown of Madness',
        'version': '0.7.01'
    },
    'Crusader\'s Mantle': {
        'name': 'Crusader\'s Mantle',
        'version': '0.7.01'
    },
    'Danse Macabre': {
        'name': 'Danse Macabre',
        'version': '0.7.01',
        'mutation': {
            'self': 'Danse Macabre'
        },
        'actors': [
            'CPR - Skeleton',
            'CPR - Zombie'
        ]
    },
    'Darkness': {
        'name': 'Darkness',
        'version': '0.7.01'
    },
    'Dawn': {
        'name': 'Dawn',
        'version': '0.7.01',
        'mutation': {
            'self': 'Dawn'
        }
    },
    'Death Ward': {
        'name': 'Death Ward',
        'version': '0.7.01',
        'settings': [
            'Death Ward'
        ]
    },
    'Destructive Wave': {
        'name': 'Destructive Wave',
        'version': '0.7.01'
    },
    'Detect Magic': {
        'name': 'Detect Magic',
        'version': '0.7.01'
    },
    'Detect Thoughts': {
        'name': 'Detect Thoughts',
        'version': '0.7.01',
        'mutation': {
            'self': 'Detect Thoughts - Probe Deeper'
        }
    },
    'Dragon\'s Breath': {
        'name': 'Dragon\'s Breath',
        'version': '0.7.01',
        'mutation': {
            'self': 'Dragon Breath'
        }
    },
    'Strike of the Giants: Frost Strike': {
        'name': 'Strike of the Giants: Frost Strike',
        'version': '0.7.01'
    },
    'Strike of the Giants: Storm Strike': {
        'name': 'Strike of the Giants: Storm Strike',
        'version': '0.7.01'
    },
    'Strike of the Giants: Cloud Strike': {
        'name': 'Strike of the Giants: Cloud Strike',
        'version': '0.7.01'
    },
    'Strike of the Giants: Fire Strike': {
        'name': 'Strike of the Giants: Fire Strike',
        'version': '0.7.01'
    },
    'Strike of the Giants: Hill Strike': {
        'name': 'Strike of the Giants: Hill Strike',
        'version': '0.7.01'
    },
    'Strike of the Giants: Stone Strike': {
        'name': 'Strike of the Giants: Stone Strike',
        'version': '0.7.01'
    },
    'Guile of the Cloud Giant: Cloudy Escape': {
        'name': 'Guile of the Cloud Giant: Cloudy Escape',
        'version': '0.7.01'
    },
    'Vigor of the Hill Giant: Bulwark': {
        'name': 'Vigor of the Hill Giant: Bulwark',
        'version': '0.7.01'
    },
    'Ember of the Fire Giant: Searing Ignition': {
        'name': 'Ember of the Fire Giant: Searing Ignition',
        'version': '0.7.01'
    },
    'Fury of the Frost Giant: Frigid Retaliation': {
        'name': 'Fury of the Frost Giant: Frigid Retaliation',
        'version': '0.7.01'
    },
    'Keenness of the Stone Giant: Stone Throw': {
        'name': 'Keenness of the Stone Giant: Stone Throw',
        'version': '0.7.01'
    },
    'Favored Foe': {
        'name': 'Favored Foe',
        'version': '0.7.01'
    },
    'Toll the Dead': {
        'name': 'Toll the Dead',
        'version': '0.7.01'
    },
    'Ray of Enfeeblement': {
        'name': 'Ray of Enfeeblement',
        'version': '0.7.01'
    },
    'Shocking Grasp': {
        'name': 'Shocking Grasp',
        'version': '0.7.01'
    },
    'Sanctuary': {
        'name': 'Sanctuary',
        'version': '0.7.01',
        'settings': [
            'Sanctuary'
        ]
    },
    'Heat Metal': {
        'name': 'Heat Metal',
        'version': '0.7.01'
    },
    'Conjure Woodland Beings': {
        'name': 'Conjure Woodland Beings',
        'version': '0.7.01',
        'mutation': {
            'self': 'Conjure Woodland Beings'
        }
    },
    'Vortex Warp': {
        'name': 'Vortex Warp',
        'version': '0.7.01'
    },
    'Tasha\'s Caustic Brew': {
        'name': 'Tasha\'s Caustic Brew',
        'version': '0.7.01'
    },
    'Crown of Madness': {
        'name': 'Crown of Madness',
        'version': '0.7.01'
    },
    'Crusader\'s Mantle': {
        'name': 'Crusader\'s Mantle',
        'version': '0.7.01'
    },
    'Sickening Radiance': {
        'name': 'Sickening Radiance',
        'version': '0.7.01',
        'settings': [
            'Template Listener'
        ]
    },
    'Blight': {
        'name': 'Blight',
        'version': '0.7.01'
    },
    'Conjure Animals': {
        'name': 'Conjure Animals',
        'version': '0.7.01',
        'mutation': {
            'self': 'Conjure Animals'
        }
    },
    'Pass without Trace': {
        'name': 'Pass without Trace',
        'version': '0.7.01'
    },
    'Zone of Truth': {
        'name': 'Zone of Truth',
        'version': '0.7.01'
    },
    'Conjure Elemental': {
        'name': 'Conjure Elemental',
        'version': '0.7.01',
        'mutation': {
            'self': 'Conjure Elemental'
        }
    },
    'Summon Shadowspawn': {
        'name': 'Summon Shadowspawn',
        'version': '0.7.01',
        'actors': [
            'CPR - Shadow Spirit'
        ]
    },
    'Storm Sphere': {
        'name': 'Storm Sphere',
        'version': '0.7.01',
        'mutation': {
            'self': 'Storm Sphere Handler'
        }
    },
    'Summon Fey': {
        'name': 'Summon Fey',
        'version': '0.7.01',
        'actors': [
            'CPR - Fey Spirit'
        ]
    },
    'Vitriolic Sphere': {
        'name': 'Vitriolic Sphere',
        'version': '0.7.01'
    },
    'Dawn': {
        'name': 'Dawn',
        'version': '0.7.01',
        'settings': [
            'Template Listener'
        ],
        'muations': {
            'self': 'Dawn'
        }
    },
    'Raulothim\'s Psychic Lance': {
        'name': 'Raulothim\'s Psychic Lance',
        'version': '0.7.01'
    },
    'Life Transference': {
        'name': 'Life Transference',
        'version': '0.7.01'
    },
    'Healing Spirit': {
        'name': 'Healing Spirit',
        'version': '0.7.01',
        'actors': [
            'CPR - Healing Spirit'
        ],
        'mutation': {
            'self': 'Healing Spirit'
        }
    },
    'Mirror Image': {
        'name': 'Mirror Image',
        'version': '0.7.01',
        'settings': [
            'Mirror Image'
        ]
    },
    'Bigby\'s Hand': {
        'name': 'Bigby\'s Hand',
        'version': '0.7.01',
        'actors': [
            'CPR - Bigby\'s Hand'
        ],
        'muation': {
            'self': 'Bigby\'s Hand'
        }
    },
    'Protection from Evil and Good': {
        'name': 'Protection from Evil and Good',
        'version': '0.7.01',
        'settings': [
            'Protection from Evil and Good'
        ]
    },
    'Chromatic Orb': {
        'name': 'Chromatic Orb',
        'version': '0.7.01'
    },
    'Aura of Vitality': {
        'name': 'Aura of Vitality',
        'version': '0.7.01',
        'mutation': {
            'self': 'Aura of Vitality'
        }
    },
    'Spike Growth': {
        'name': 'Spike Growth',
        'version': '0.7.01'
    },
    'Mass Cure Wounds': {
        'name': 'Mass Cure Wounds',
        'version': '0.7.01'
    },
    'Earth Tremor': {
        'name': 'Earth Tremor',
        'version': '0.7.01'
    },
    'Charm Person': {
        'name': 'Charm Person',
        'version': '0.7.01'
    },
    'Detect Magic': {
        'name': 'Detect Magic',
        'version': '0.7.01'
    },
    'Eldritch Blast': {
        'name': 'Eldritch Blast',
        'version': '0.7.01'
    },
    'Summon Aberration': {
        'name': 'Summon Aberration',
        'version': '0.7.01',
        'actors': [
            'CPR - Aberrant Spirit'
        ]
    },
    'Spirit Guardians': {
        'name': 'Spirit Guardians',
        'version': '0.7.01',
        'settings': [
            'Movement Listener',
            'Combat Listener'
        ]
    },
    'Sapping Sting': {
        'name': 'Sapping Sting',
        'version': '0.7.01'
    },
    'Hypnotic Pattern': {
        'name': 'Hypnotic Pattern',
        'version': '0.7.01'
    },
    'Summon Draconic Spirit': {
        'name': 'Summon Draconic Spirit',
        'version': '0.7.01',
        'actors': [
            'CPR - Draconic Spirit'
        ]
    },
    'Blink': {
        'name': 'Blink',
        'version': '0.7.01'
    },
    'Danse Macabre': {
        'name': 'Danse Macabre',
        'version': '0.7.01',
        'actors': [
            'CPR - Skeleton',
            'CPR - Zombie'
        ],
        'mutation': {
            'self': 'Danse Macabre - Command Undead'
        }
    },
    'Destructive Wave': {
        'name': 'Destructive Wave',
        'version': '0.7.01'
    },
    'Scorching Ray': {
        'name': 'Scorching Ray',
        'version': '0.7.01'
    },
    'Chain Lightning': {
        'name': 'Chain Lightning',
        'version': '0.7.01'
    },
    'Misty Step': {
        'name': 'Misty Step',
        'version': '0.7.01'
    },
    'Conjure Celestial': {
        'name': 'Conjure Celestial',
        'version': '0.7.01',
        'mutation': {
            'self': 'Conjure Celestial'
        }
    },
    'Detect Thoughts': {
        'name': 'Detect Thoughts',
        'version': '0.7.01',
        'mutation': {
            'self': 'Detect Thoughts - Probe Deeper'
        }
    },
    'Wither and Bloom': {
        'name': 'Wither and Bloom',
        'version': '0.7.01'
    },
    'Darkness': {
        'name': 'Darkness',
        'version': '0.7.01',
        'settings': [
            'Darkness'
        ]
    },
    'Hold Person': {
        'name': 'Hold Person',
        'version': '0.7.01',
        'settings': [
            'Active Effect Additions'
        ]
    },
    'Shadow of Moil': {
        'name': 'Shadow of Moil',
        'version': '0.7.01',
        'settings': [
            'Shadow of Moil'
        ]
    },
    'Conjure Minor Elementals': {
        'name': 'Conjure Minor Elementals',
        'version': '0.7.01',
        'mutation': {
            'self': 'Conjure Minor Elementals'
        }
    },
    'Mind Sliver': {
        'name': 'Mind Sliver',
        'version': '0.7.01'
    },
    'Summon Construct': {
        'name': 'Summon Construct',
        'version': '0.7.01',
        'actors': [
            'CPR - Construct Spirit'
        ],
        'settings': [
            'On Hit'
        ]
    },
    'Thunder Step': {
        'name': 'Thunder Step',
        'version': '0.7.01'
    },
    'Death Ward': {
        'name': 'Death Ward',
        'version': '0.7.01',
        'settings': [
            'Death Ward'
        ]
    },
    'Conjure Fey': {
        'name': 'Conjure Fey',
        'version': '0.7.01',
        'mutation': {
            'self': 'Conjure Fey'
        }
    },
    'Hail of Thorns': {
        'name': 'Hail of Thorns',
        'version': '0.7.01'
    },
    'Cloudkill': {
        'name': 'Cloudkill',
        'version': '0.7.01',
        'settings': [
            'Template Listener'
        ]
    },
    'Melf\'s Acid Arrow': {
        'name': 'Melf\'s Acid Arrow',
        'version': '0.7.01'
    },
    'Shadow Blade': {
        'name': 'Shadow Blade',
        'version': '0.7.01',
        'mutation': {
            'self': 'Shadow Blade Sword'
        }
    },
    'Warding Bond': {
        'name': 'Warding Bond',
        'version': '0.7.01',
        'settings': [
            'Warding Bond',
            'On Hit'
        ]
    },
    'Blade Ward': {
        'name': 'Blade Ward',
        'version': '0.7.01'
    },
    'Summon Elemental': {
        'name': 'Summon Elemental',
        'version': '0.7.01',
        'actors': [
            'CPR - Elemental'
        ]
    },
    'Gaseous Form': {
        'name': 'Gaseous Form',
        'version': '0.7.01'
    },
    'Moonbeam': {
        'name': 'Moonbeam',
        'version': '0.7.01',
        'settings': [
            'Template Listener'
        ],
        'mutation': {
            'self': 'Moonbeam'
        }
    },
    'Summon Undead': {
        'name': 'Summon Undead',
        'version': '0.7.01',
        'actors': [
            'CPR - Undead Spirit'
        ]
    },
    'Aura of Purity': {
        'name': 'Aura of Purity',
        'version': '0.7.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Holy Weapon': {
        'name': 'Holy Weapon',
        'version': '0.7.01',
        'mutation': {
            'self': 'Holy Weapon'
        }
    },
    'Guardian of Faith': {
        'name': 'Guardian of Faith',
        'version': '0.7.01',
        'settings': [
            'Movement Listener',
            'Combat Listener'
        ]
    },
    'Magic Missile': {
        'name': 'Magic Missile',
        'version': '0.7.01'
    },
    'Lightning Arrow': {
        'name': 'Lightning Arrow',
        'version': '0.7.01',
    },
    'Thorn Whip': {
        'name': 'Thorn Whip',
        'version': '0.7.01'
    },
    'Dragon\'s Breath': {
        'name': 'Dragon\'s Breath',
        'version': '0.7.01'
    },
    'Animate Dead': {
        'name': 'Animate Dead',
        'version': '0.7.01',
        'actors': [
            'CPR - Skeleton',
            'CPR - Zombie'
        ]
    },
    'Lightning Lure': {
        'name': 'Lightning Lure',
        'version': '0.7.01'
    },
    'Spiritual Weapon': {
        'name': 'Spiritual Weapon',
        'version': '0.7.01',
        'actors': [
            'CPR - Spiritual Weapon'
        ],
        'mutation': {
            'self': 'Spiritual Weapon'
        }
    },
    'Beacon of Hope': {
        'name': 'Beacon of Hope',
        'version': '0.7.01',
        'settings': [
            'Beacon of Hope'
        ]
    },
    'Vampiric Touch': {
        'name': 'Vampiric Touch',
        'version': '0.7.01',
        'mutation': {
            'self': 'Vampiric Touch'
        }
    },
    'Hunter\'s Mark': {
        'name': 'Hunter\'s Mark',
        'version': '0.7.01',
        'mutation': {
            'self': 'huntersMark'
        }
    },
    'Guiding Bolt': {
        'name': 'Guiding Bolt',
        'version': '0.7.01'
    },
    'Chill Touch': {
        'name': 'Chill Touch',
        'version': '0.7.01'
    },
    'Hex': {
        'name': 'Hex',
        'version': '0.7.01',
        'mutation': {
            'self': 'Hex'
        }
    },
    'Arms of Hadar': {
        'name': 'Arms of Hadar',
        'version': '0.7.01'
    },
    'Summon Celestial': {
        'name': 'Summon Celestial',
        'version': '0.7.01',
        'actors': [
            'CPR - Celestial Spirit'
        ]
    },
    'Summon Fiend': {
        'name': 'Summon Fiend',
        'version': '0.7.01',
        'actors': [
            'CPR - Fiendish Spirit'
        ]
    },
    'Tidal Wave': {
        'name': 'Tidal Wave',
        'version': '0.7.01'
    },
    'Summon Beast': {
        'name': 'Summon Beast',
        'version': '0.7.01',
        'actors': [
            'CPR - Bestial Spirit'
        ]
    },
    'Bestow Curse': {
        'name': 'Bestow Curse',
        'version': '0.7.01'
    },
    'Fog Cloud': {
        'name': 'Fog Cloud',
        'version': '0.7.01'
    },
    'Spirit Shroud': {
        'name': 'Spirit Shroud',
        'version': '0.7.01'
    },
    'Call Lightning': {
        'name': 'Call Lightning',
        'version': '0.7.01',
        'mutation': {
            'self': 'Storm Bolt'
        }
    }
}