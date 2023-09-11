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
            if (!token) {
                if (message != '') message += '<hr>';
                message += 'This automation requires your token to be on the scene.';
                cancel = true;
            } else {
                let mutationStack = warpgate.mutationStack(token.document);
                if (mutationStack.getName(info.mutation.self)) await warpgate.revert(token.document, info.mutation.self);
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
export async function setCompendiumItemInfo(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        if (automations[i.name]) {
            await i.setFlag('chris-premades', 'info', automations[i.name]);
        }
    }
}
export async function stripUnusedFlags(key) {
    let gamePack = game.packs.get(key);
    await gamePack.getDocuments();
    for (let i of gamePack.contents) {
        await i.update({'flags.-=ddbimporter': null});
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
        'version': '0.7.03',
        'settings': [
            'Movement Listener',
            'Combat Listener'
        ],
        'actors': [
            'CPR - Guardian of Faith'
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
    },
    'Alchemical Savant': {
        'name': 'Alchemical Savant',
        'version': '0.7.01'
    },
    'Experimental Elixir': {
        'name': 'Experimental Elixir',
        'version': '0.7.01'
    },
    'Arcane Armor: Guardian Model': {
        'name': 'Arcane Armor: Guardian Model',
        'version': '0.7.01',
        'settings': [
            'Rest Listener'
        ]
    },
    'Arcane Armor: Infiltrator Model': {
        'name': 'Arcane Armor: Infiltrator Model',
        'version': '0.7.01',
        'settings': [
            'Rest Listener'
        ]
    },
    'Arcane Jolt': {
        'name': 'Arcane Jolt',
        'version': '0.7.01',
        'classes': [
            'battle-smith'
        ],
        'scales': [
            'arcane-jolt'
        ]
    },
    'Steel Defender': {
        'name': 'Steel Defender',
        'version': '0.7.01',
        'actors': [
            'CPR - Steel Defender'
        ],
        'mutation': {
            'self': 'Steel Defender'
        }
    },
    'Create Homunculus Servant': {
        'name': 'Create Homunculus Servant',
        'version': '0.7.01',
        'actors': [
            'CPR - Homunculus Servant'
        ],
        'mutation': {
            'self': 'Homunculus Servant'
        }
    },
    'Ancestral Protectors': {
        'name': 'Ancestral Protectors',
        'version': '0.7.01'
    },
    'Rage': {
        'name': 'Rage',
        'version': '0.7.01',
        'mutation': {
            'self': 'Rage'
        }
    },
    'Totem Spirit: Bear': {
        'name': 'Totem Spirit: Bear',
        'version': '0.7.01'
    },
    'Danger Sense': {
        'name': 'Danger Sense',
        'version': '0.7.01',
        'settings': [
            'Save Patching'
        ]
    },
    'Unarmored Defense (Barbarian)': {
        'name': 'Unarmored Defense (Barbarian)',
        'version': '0.7.01'
    },
    'Animating Performance': {
        'name': 'Animating Performance',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Item'
        ],
        'mutation': {
            'self': 'Dancing Item'
        }
    },
    'Bardic Inspiration, Magical Inspiration, & Mote of Potential': {
        'name': 'Bardic Inspiration, Magical Inspiration, & Mote of Potential',
        'version': '0.7.01',
        'classes': [
            'bard'
        ],
        'scales': [
            'bardic-inspiration'
        ]
    },
    'Blade Flourish': {
        'name': 'Blade Flourish',
        'version': '0.7.01',
        'classes': [
            'bard'
        ],
        'scales': [
            'bardic-inspiration'
        ]
    },
    'Blade Flourish Movement': {
        'name': 'Blade Flourish Movement',
        'version': '0.7.01'
    },
    'Defensive Flourish': {
        'name': 'Defensive Flourish',
        'version': '0.7.01'
    },
    'Mobile Flourish': {
        'name': 'Mobile Flourish',
        'version': '0.7.01'
    },
    'Slashing Flourish': {
        'name': 'Slashing Flourish',
        'version': '0.7.01'
    },
    'Blood Curse of the Fallen Puppet': {
        'name': 'Blood Curse of the Fallen Puppet',
        'version': '0.7.01',
        'classes': [
            'blood-hunter'
        ],
        'scales': [
            'crimson-rite'
        ]
    },
    'Blood Curse of the Muddled Mind': {
        'name': 'Blood Curse of the Muddled Mind',
        'version': '0.7.01',
        'classes': [
            'blood-hunter'
        ],
        'scales': [
            'crimson-rite'
        ]
    },
    'Hybrid Transformation': {
        'name': 'Hybrid Transformation',
        'version': 'Hybrid Transformation',
        'mutation': {
            'self': 'Hybrid Transformation'
        },
        'classes': [
            'blood-hunter'
        ]
    },
    'Stalker\'s Prowess': {
        'name': 'Stalker\'s Prowess',
        'version': '0.7.01'
    },
    'Formulas: Aether': {
        'name': 'Formulas: Aether',
        'version': '0.7.01'
    },
    'Formulas: Alluring': {
        'name': 'Formulas: Alluring',
        'version': '0.7.01'
    },
    'Formulas: Celerity': {
        'name': 'Formulas: Celerity',
        'version': '0.7.01'
    },
    'Formulas: Conversant': {
        'name': 'Formulas: Conversant',
        'version': '0.7.01'
    },
    'Formulas: Cruelty': {
        'name': 'Formulas: Cruelty',
        'version': '0.7.01'
    },
    'Formulas: Deftness': {
        'name': 'Formulas: Deftness',
        'version': '0.7.01'
    },
    'Formulas: Embers': {
        'name': 'Formulas: Embers',
        'version': '0.7.01'
    },
    'Formulas: Gelid': {
        'name': 'Formulas: Gelid',
        'version': '0.7.01'
    },
    'Formulas: Impermeable': {
        'name': 'Formulas: Impermeable',
        'version': '0.7.01'
    },
    'Formulas: Mobility': {
        'name': 'Formulas: Mobility',
        'version': '0.7.01'
    },
    'Formulas: Nighteye': {
        'name': 'Formulas: Nighteye',
        'version': '0.7.01'
    },
    'Formulas: Percipient': {
        'name': 'Formulas: Percipient',
        'version': '0.7.01'
    },
    'Formulas: Potency': {
        'name': 'Formulas: Potency',
        'version': '0.7.01'
    },
    'Formulas: Precision': {
        'name': 'Formulas: Precision',
        'version': '0.7.01'
    },
    'Formulas: Rapidity': {
        'name': 'Formulas: Rapidity',
        'version': '0.7.01'
    },
    'Formulas: Reconstruction': {
        'name': 'Formulas: Reconstruction',
        'version': '0.7.01'
    },
    'Formulas: Sagacity': {
        'name': 'Formulas: Sagacity',
        'version': '0.7.01'
    },
    'Formulas: Shielded': {
        'name': 'Formulas: Shielded',
        'version': '0.7.01'
    },
    'Formulas: Unbreakable': {
        'name': 'Formulas: Unbreakable',
        'version': '0.7.01'
    },
    'Formulas: Vermillion': {
        'name': 'Formulas: Vermillion',
        'version': '0.7.01'
    },
    'Mutagencraft - Create Mutagen': {
        'name': 'Mutagencraft - Create Mutagen',
        'version': '0.7.01'
    },
    'Strange Metabolism': {
        'name': 'Strange Metabolism',
        'version': '0.7.01'
    },
    'Brand of Castigation': {
        'name': 'Brand of Castigation',
        'version': '0.7.01',
        'classes': [
            'blood-hunter'
        ],
        'scales': [
            'crimson-rite'
        ]
    },
    'Crimson Rite': {
        'name': 'Crimson Rite',
        'version': '0.7.01',
        'classes': [
            'blood-hunter'
        ],
        'scales': [
            'crimson-rite'
        ]
    },
    'Reaper': {
        'name': 'Reaper',
        'version': '0.7.01'
    },
    'Blessing of the Forge': {
        'name': 'Blessing of the Forge',
        'version': '0.7.01',
        'mutation': {
            'self': 'Blessing of the Forge'
        }
    },
    'Channel Divinity: Path to the Grave': {
        'name': 'Channel Divinity: Path to the Grave',
        'version': '0.7.01'
    },
    'Circle of Mortality': {
        'name': 'Circle of Mortality',
        'version': '0.7.01'
    },
    'Channel Divinity: Preserve Life': {
        'name': 'Channel Divinity: Preserve Life',
        'version': '0.7.01'
    },
    'Channel Divinity: Radiance of the Dawn': {
        'name': 'Channel Divinity: Radiance of the Dawn',
        'version': '0.7.01'
    },
    'Channel Divinity: Balm of Peace': {
        'name': 'Channel Divinity: Balm of Peace',
        'version': '0.7.01'
    },
    'Emboldening Bond': {
        'name': 'Emboldening Bond',
        'version': '0.7.01',
        'settings': [
            'Emboldening Bond'
        ]
    },
    'Expansive Bond': {
        'name': 'Expansive Bond',
        'version': '0.7.01',
        'settings': [
            'Emboldening Bond'
        ]
    },
    'Protective Bond': {
        'name': 'Protective Bond',
        'version': '0.7.01',
        'settings': [
            'Emboldening Bond'
        ]
    },
    'Channel Divinity: Destructive Wrath': {
        'name': 'Channel Divinity: Destructive Wrath',
        'version': '0.7.01'
    },
    'Thunderbolt Strike': {
        'name': 'Thunderbolt Strike',
        'version': '0.7.01'
    },
    'Wrath of the Storm': {
        'name': 'Wrath of the Storm',
        'version': '0.7.01'
    },
    'Channel Divinity: Twilight Sanctuary': {
        'name': 'Channel Divinity: Twilight Sanctuary',
        'version': '0.7.01'
    },
    'Eyes of Night': {
        'name': 'Eyes of Night',
        'version': '0.7.01'
    },
    'Steps of Night': {
        'name': 'Steps of Night',
        'version': '0.7.01'
    },
    'Vigilant Blessing': {
        'name': 'Vigilant Blessing',
        'version': '0.7.01'
    },
    'Blessed Strikes': {
        'name': 'Blessed Strikes',
        'version': '0.7.01'
    },
    'Channel Divinity: Turn Undead': {
        'name': 'Channel Divinity: Turn Undead',
        'version': '0.7.01'
    },
    'Divine Strike': {
        'name': 'Divine Strike',
        'version': '0.7.01'
    },
    'Potent Spellcasting': {
        'name': 'Potent Spellcasting',
        'version': '0.7.01'
    },
    'Starry Form': {
        'name': 'Starry Form',
        'version': '0.7.01',
        'mutation': {
            'self': 'Starry Form'
        }
    },
    'Twinkling Constellations': {
        'name': 'Twinkling Constellations',
        'version': '0.7.01'
    },
    'Summon Wildfire Spirit': {
        'name': 'Summon Wildfire Spirit',
        'version': '0.7.01',
        'actors': [
            'CPR - Wildfire Spirit'
        ],
        'classes': [
            'druid'
        ],
        'mutation': {
            'self': 'Wildfire Spirit'
        }
    },
    'Primal Strike': {
        'name': 'Primal Strike',
        'version': '0.7.01'
    },
    'Wild Shape': {
        'name': 'Wild Shape',
        'version': '0.7.01',
        'mutation': {
            'self': 'Wild Shape'
        }
    },
    'Maneuvers: Ambush': {
        'name': 'Maneuvers: Ambush',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Bait and Switch': {
        'name': 'Maneuvers: Bait and Switch',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Brace': {
        'name': 'Maneuvers: Brace',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Commander\'s Strike': {
        'name': 'Maneuvers: Commander\'s Strike',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Disarming Attack': {
        'name': 'Maneuvers: Disarming Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Distracting Strike': {
        'name': 'Maneuvers: Distracting Strike',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Evasive Footwork': {
        'name': 'Maneuvers: Evasive Footwork',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Feinting Attack': {
        'name': 'Maneuvers: Feinting Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Goading Attack': {
        'name': 'Maneuvers: Goading Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Grappling Strike': {
        'name': 'Maneuvers: Grappling Strike',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Lunging Attack': {
        'name': 'Maneuvers: Lunging Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Maneuvering Attack': {
        'name': 'Maneuvers: Maneuvering Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Menacing Attack': {
        'name': 'Maneuvers: Menacing Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Parry': {
        'name': 'Maneuvers: Parry',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Precision Attack': {
        'name': 'Maneuvers: Precision Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Pushing Attack': {
        'name': 'Maneuvers: Pushing Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Quick Toss': {
        'name': 'Maneuvers: Quick Toss',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Rally': {
        'name': 'Maneuvers: Rally',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Riposte': {
        'name': 'Maneuvers: Riposte',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Sweeping Attack': {
        'name': 'Maneuvers: Sweeping Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Tactical Assessment': {
        'name': 'Maneuvers: Tactical Assessment',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Maneuvers: Trip Attack': {
        'name': 'Maneuvers: Trip Attack',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Superiority Dice': {
        'name': 'Superiority Dice',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'combat-superiority-die'
        ]
    },
    'Fighting Spirit': {
        'name': 'Fighting Spirit',
        'version': '0.7.01',
        'classes': [
            'fighter'
        ],
        'scales': [
            'fighting-spirit'
        ]
    },
    'Shadow Step': {
        'name': 'Shadow Step',
        'version': '0.7.01'
    },
    'Evasion': {
        'name': 'Evasion',
        'version': '0.7.01'
    },
    'Focused Aim': {
        'name': 'Focused Aim',
        'version': '0.7.01'
    },
    'Patient Defense': {
        'name': 'Patient Defense',
        'version': '0.7.01'
    },
    'Quickened Healing': {
        'name': 'Quickened Healing',
        'version': '0.7.01',
        'classes': [
            'monk'
        ],
        'scales': [
            'quickened-healing'
        ]
    },
    'Stillness of Mind': {
        'name': 'Stillness of Mind',
        'version': '0.7.01'
    },
    'Stunning Strike': {
        'name': 'Stunning Strike',
        'version': '0.7.01'
    },
    'Unarmored Defense (Monk)': {
        'name': 'Unarmored Defense (Monk)',
        'version': '0.7.01'
    },
    'Aura of Alacrity': {
        'name': 'Aura of Alacrity',
        'version': '0.7.01'
    },
    'Channel Divinity: Inspiring Smite': {
        'name': 'Channel Divinity: Inspiring Smite',
        'version': '0.7.01'
    },
    'Channel Divinity: Peerless Athlete': {
        'name': 'Channel Divinity: Peerless Athlete',
        'version': '0.7.01'
    },
    'Aura of Warding': {
        'name': 'Aura of Warding',
        'version': '0.7.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Aura of Courage': {
        'name': 'Aura of Courage',
        'version': '0.7.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Aura of Protection': {
        'name': 'Aura of Protection',
        'version': '0.7.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Divine Smite': {
        'name': 'Divine Smite',
        'version': '0.7.01'
    },
    'Primal Companion': {
        'name': 'Primal Companion',
        'version': '0.7.01',
        'actors': [
            'CPR - Primal Companion'
        ],
        'mutation': {
            'self': 'Primal Companion'
        }
    },
    'Drake Companion: Summon': {
        'name': 'Drake Companion: Summon',
        'version': '0.7.01',
        'actors': [
            'CPR - Drake Companion'
        ],
        'mutation': {
            'self': 'Drake Companion'
        }
    },
    'Beguiling Twist': {
        'name': 'Beguiling Twist',
        'version': '0.7.01'
    },
    'Dreadful Strikes': {
        'name': 'Dreadful Strikes',
        'version': '0.7.01',
        'classes': [
            'ranger'
        ],
        'scales': [
            'dreadful-strikes'
        ]
    },
    'Dread Ambusher': {
        'name': 'Dread Ambusher',
        'version': '0.7.01'
    },
    'Favored Foe': {
        'name': 'Favored Foe',
        'version': '0.7.01',
        'classes': [
            'ranger'
        ],
        'scales': [
            'favored-foe'
        ]
    },
    'Rakish Audacity': {
        'name': 'Rakish Audacity',
        'version': '0.7.01'
    },
    'Evasion': {
        'name': 'Evasion',
        'version': '0.7.01'
    },
    'Sneak Attack': {
        'name': 'Sneak Attack',
        'version': '0.7.01'
    },
    'Favored by the Gods': {
        'name': 'Favored by the Gods',
        'version': '0.7.01'
    },
    'Metamagic - Careful Spell': {
        'name': 'Metamagic - Careful Spell',
        'version': '0.7.01'
    },
    'Metamagic - Twinned Spell': {
        'name': 'Metamagic - Twinned Spell',
        'version': '0.7.01'
    },
    'Metamagic - Transmuted Spell': {
        'name': 'Metamagic - Transmuted Spell',
        'version': '0.7.01'
    },
    'Metamagic - Seeking Spell': {
        'name': 'Metamagic - Seeking Spell',
        'version': '0.7.01'
    },
    'Metamagic - Heightened Spell': {
        'name': 'Metamagic - Heightened Spell',
        'version': '0.7.01'
    },
    'Metamagic - Empowered Spell': {
        'name': 'Metamagic - Empowered Spell',
        'version': '0.7.01'
    },
    'Strength of the Grave': {
        'name': 'Strength of the Grave',
        'version': '0.7.01',
        'settings': [
            'Strength of the Grave'
        ]
    },
    'Heart of the Storm': {
        'name': 'Heart of the Storm',
        'version': '0.7.01'
    },
    'Sorcery Points': {
        'name': 'Sorcery Points',
        'version': '0.7.01'
    },
    'Devil\'s Sight': {
        'name': 'Devil\'s Sight',
        'version': '0.7.01'
    },
    'Eldritch Invocations: Agonizing Blast': {
        'name': 'Eldritch Invocations: Agonizing Blast',
        'version': '0.7.01'
    },
    'Eldritch Invocations: Grasp of Hadar': {
        'name': 'Eldritch Invocations: Grasp of Hadar',
        'version': '0.7.01'
    },
    'Eldritch Invocations: Repelling Blast': {
        'name': 'Eldritch Invocations: Repelling Blast',
        'version': '0.7.01'
    },
    'Eldritch Smite': {
        'name': 'Eldritch Smite',
        'version': '0.7.01'
    },
    'Maddening Hex': {
        'name': 'Maddening Hex',
        'version': '0.7.01'
    },
    'One with Shadows': {
        'name': 'One with Shadows',
        'version': '0.7.01'
    },
    'Relentless Hex': {
        'name': 'Relentless Hex',
        'version': '0.7.01'
    },
    'Fey Presence': {
        'name': 'Fey Presence',
        'version': '0.7.01'
    },
    'Misty Escape': {
        'name': 'Misty Escape',
        'version': '0.7.01'
    },
    'Healing Light': {
        'name': 'Healing Light',
        'version': '0.7.01'
    },
    'Radiant Soul': {
        'name': 'Radiant Soul',
        'version': '0.7.01'
    },
    'Tentacle of the Deeps: Summon': {
        'name': 'Tentacle of the Deeps: Summon',
        'version': '0.7.01',
        'actors': [
            'CPR - Spectral Tentacle'
        ],
        'mutation': {
            'self': 'Tentacle of the Deeps'
        }
    },
    'Dark One\'s Blessing': {
        'name': 'Dark One\'s Blessing',
        'version': '0.7.01'
    },
    'Dark One\'s Own Luck': {
        'name': 'Dark One\'s Own Luck',
        'version': '0.7.01'
    },
    'Elemental Gift - Flight': {
        'name': 'Elemental Gift - Flight',
        'version': '0.7.01'
    },
    'Elemental Gift: Elemental Gift (Dao)': {
        'name': 'Elemental Gift: Elemental Gift (Dao)',
        'version': '0.7.01'
    },
    'Elemental Gift: Elemental Gift (Djinni)': {
        'name': 'Elemental Gift: Elemental Gift (Djinni)',
        'version': '0.7.01'
    },
    'Elemental Gift: Elemental Gift (Efreeti)': {
        'name': 'Elemental Gift: Elemental Gift (Efreeti)',
        'version': '0.7.01'
    },
    'Elemental Gift: Elemental Gift (Marid)': {
        'name': 'Elemental Gift: Elemental Gift (Marid)',
        'version': '0.7.01'
    },
    'Genie\'s Vessel: Genie\'s Wrath (Dao)': {
        'name': 'Genie\'s Vessel: Genie\'s Wrath (Dao)',
        'version': '0.7.01'
    },
    'Genie\'s Vessel: Genie\'s Wrath (Djinni)': {
        'name': 'Genie\'s Vessel: Genie\'s Wrath (Djinni)',
        'version': '0.7.01'
    },
    'Genie\'s Vessel: Genie\'s Wrath (Efreeti)': {
        'name': 'Genie\'s Vessel: Genie\'s Wrath (Efreeti)',
        'version': '0.7.01'
    },
    'Genie\'s Vessel: Genie\'s Wrath (Marid)': {
        'name': 'Genie\'s Vessel: Genie\'s Wrath (Marid)',
        'version': '0.7.01'
    },
    'Hexblade\'s Curse': {
        'name': 'Hexblade\'s Curse',
        'version': '0.7.01',
        'classes': [
            'warlock'
        ]
    },
    'Form of Dread': {
        'name': 'Form of Dread',
        'version': '0.7.01'
    },
    'Form of Dread: Fear': {
        'name': 'Form of Dread: Fear',
        'version': '0.7.01'
    },
    'Grave Touched': {
        'name': 'Grave Touched',
        'version': '0.7.01'
    },
    'Awakened Spellbook: Replace Damage': {
        'name': 'Awakened Spellbook: Replace Damage',
        'version': '0.7.01'
    },
    'Arcane Ward': {
        'name': 'Arcane Ward',
        'version': '0.7.01',
        'settings': [
            'Rest Listener',
            'Arcane Ward'
        ]
    },
    'Projected Ward': {
        'name': 'Projected Ward',
        'version': '0.7.01',
        'settings': [
            'Arcane Ward'
        ]
    },
    'Expert Divination': {
        'name': 'Expert Divination',
        'version': '0.7.01'
    },
    'Grim Harvest': {
        'name': 'Grim Harvest',
        'version': '0.7.01'
    },
    'Undead Thralls': {
        'name': 'Undead Thralls',
        'version': '0.7.01'
    },
    'Elixir of Health': {
        'name': 'Elixir of Health',
        'version': '0.7.01'
    },
    'Oil of Sharpness': {
        'name': 'Oil of Sharpness',
        'version': '0.7.01'
    },
    'Potion of Advantage': {
        'name': 'Potion of Advantage',
        'version': '0.7.01'
    },
    'Potion of Aqueous Form': {
        'name': 'Potion of Aqueous Form',
        'version': '0.7.01'
    },
    'Potion of Diminution': {
        'name': 'Potion of Diminution',
        'version': '0.7.01'
    },
    'Potion of Fire Breath': {
        'name': 'Potion of Fire Breath',
        'version': '0.7.01',
        'mutation': {
            'self': 'Potion of Fire Breath'
        }
    },
    'Potion of Giant Size': {
        'name': 'Potion of Giant Size',
        'version': '0.7.01'
    },
    'Potion of Growth': {
        'name': 'Potion of Growth',
        'version': '0.7.01'
    },
    'Potion of Heroism': {
        'name': 'Potion of Heroism',
        'version': '0.7.01'
    },
    'Potion of Invisibility': {
        'name': 'Potion of Invisibility',
        'version': '0.7.01'
    },
    'Potion of Invulnerability': {
        'name': 'Potion of Invulnerability',
        'version': '0.7.01'
    },
    'Potion of Maximum Power': {
        'name': 'Potion of Maximum Power',
        'version': '0.7.01'
    },
    'Potion of Poison': {
        'name': 'Potion of Poison',
        'version': '0.7.01'
    },
    'Potion of Speed': {
        'name': 'Potion of Speed',
        'version': '0.7.01'
    },
    'Potion of Vitality': {
        'name': 'Potion of Vitality',
        'version': '0.7.01'
    },
    'Ring of Spell Storing (0/5)': {
        'name': 'Ring of Spell Storing (0/5)',
        'version': '0.7.01'
    },
    'Boots of Elvenkind': {
        'name': 'Boots of Elvenkind',
        'version': '0.7.01'
    },
    'Dragon Vessel (Ascendant)': {
        'name': 'Dragon Vessel (Ascendant)',
        'version': '0.7.01'
    },
    'Dragon Vessel (Slumbering)': {
        'name': 'Dragon Vessel (Slumbering)',
        'version': '0.7.01'
    },
    'Dragon Vessel (Stirring)': {
        'name': 'Dragon Vessel (Stirring)',
        'version': '0.7.01'
    },
    'Dragon Vessel (Wakened)': {
        'name': 'Dragon Vessel (Wakened)',
        'version': '0.7.01'
    },
    'Dragon-Touched Focus (Slumbering)': {
        'name': 'Dragon-Touched Focus (Slumbering)',
        'version': '0.7.01'
    },
    'Dragon-Touched Focus (Stirring / Chromatic)': {
        'name': 'Dragon-Touched Focus (Stirring / Chromatic)',
        'version': '0.7.01'
    },
    'Dragon-Touched Focus (Stirring / Gem)': {
        'name': 'Dragon-Touched Focus (Stirring / Gem)',
        'version': '0.7.01'
    },
    'Eyes of Minute Seeing': {
        'name': 'Eyes of Minute Seeing',
        'version': '0.7.01',
        'settings': [
            'Skill Patching'
        ]
    },
    'Eyes of the Eagle': {
        'name': 'Eyes of the Eagle',
        'version': '0.7.01',
        'settings': [
            'Skill Patching'
        ]
    },
    'Lantern of Revealing': {
        'name': 'Lantern of Revealing',
        'version': '0.7.01',
        'settings': [
            'Effect Auras'
        ]
    },
    'Stormgirdle (Awakened)': {
        'name': 'Stormgirdle (Awakened)',
        'version': '0.7.01',
        'mutation': {
            'self': 'Storm Avatar'
        }
    },
    'Stormgirdle (Dormant)': {
        'name': 'Stormgirdle (Dormant)',
        'version': '0.7.01',
        'mutation': {
            'self': 'Storm Avatar'
        }
    },
    'Stormgirdle (Exalted)': {
        'name': 'Stormgirdle (Exalted)',
        'version': '0.7.01',
        'mutation': {
            'self': 'Storm Avatar'
        }
    },
    'Blackrazor': {
        'name': 'Blackrazor',
        'version': '0.7.01',
        'settings': [
            'On Hit'
        ]
    },
    'Dancing Greatsword': {
        'name': 'Dancing Greatsword',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Sword'
        ],
        'mutation': {
            'self': 'Dancing Sword'
        }
    },
    'Dancing Greatsword': {
        'name': 'Dancing Greatsword',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Sword'
        ],
        'mutation': {
            'self': 'Dancing Sword'
        }
    },
    'Dancing Longsword': {
        'name': 'Dancing Longsword',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Sword'
        ],
        'mutation': {
            'self': 'Dancing Sword'
        }
    },
    'Dancing Rapier': {
        'name': 'Dancing Rapier',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Sword'
        ],
        'mutation': {
            'self': 'Dancing Sword'
        }
    },
    'Dancing Scimitar': {
        'name': 'Dancing Scimitar',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Sword'
        ],
        'mutation': {
            'self': 'Dancing Sword'
        }
    },
    'Dancing Shortsword': {
        'name': 'Dancing Shortsword',
        'version': '0.7.01',
        'actors': [
            'CPR - Dancing Sword'
        ],
        'mutation': {
            'self': 'Dancing Sword'
        }
    },
    'Dragon\'s Wrath Weapon (Ascendant)': {
        'name': 'Dragon\'s Wrath Weapon (Ascendant)',
        'version': '0.7.01'
    },
    'Dragon\'s Wrath Weapon (Slumbering)': {
        'name': 'Dragon\'s Wrath Weapon (Slumbering)',
        'version': '0.7.01'
    },
    'Dragon\'s Wrath Weapon (Stirring)': {
        'name': 'Dragon\'s Wrath Weapon (Stirring)',
        'version': '0.7.01'
    },
    'Dragon\'s Wrath Weapon (Wakened)': {
        'name': 'Dragon\'s Wrath Weapon (Wakened)',
        'version': '0.7.01'
    },
    'Grovelthrash (Awakened)': {
        'name': 'Grovelthrash (Awakened)',
        'version': '0.7.01'
    },
    'Grovelthrash (Dormant)': {
        'name': 'Grovelthrash (Dormant)',
        'version': '0.7.01'
    },
    'Grovelthrash (Exalted)': {
        'name': 'Grovelthrash (Exalted)',
        'version': '0.7.01'
    },
    'Blood Spear': {
        'name': 'Blood Spear',
        'version': '0.7.01'
    },
    'Insignia of Claws': {
        'name': 'Insignia of Claws',
        'version': '0.7.01'
    },
    'Celestial Revelation (Necrotic Shroud)': {
        'name': 'Celestial Revelation (Necrotic Shroud)',
        'version': '0.7.01'
    },
    'Celestial Revelation (Radiant Consumption)': {
        'name': 'Celestial Revelation (Radiant Consumption)',
        'version': '0.7.01'
    },
    'Celestial Revelation (Radiant Soul)': {
        'name': 'Celestial Revelation (Radiant Soul)',
        'version': '0.7.01'
    },
    'Astral Trance': {
        'name': 'Astral Trance',
        'version': '0.7.01',
        'mutation': {
            'self': 'Trance'
        }
    },
    'Fey Ancestry': {
        'name': 'Fey Ancestry',
        'version': '0.7.01',
        'settings': [
            'Condition Resistance'
        ]
    },
    'Starlight Step': {
        'name': 'Starlight Step',
        'version': '0.7.01'
    },
    'Vampiric Bite': {
        'name': 'Vampiric Bite',
        'version': '0.7.01'
    },
    'Dwarven Resilience': {
        'name': 'Dwarven Resilience',
        'version': '0.7.01',
        'settings': [
            'Condition Resistance'
        ]
    },
    'Change Season': {
        'name': 'Change Season',
        'version': '0.7.01',
        'mutation': {
            'self': 'Eladrin Season'
        }
    },
    'Fey Step': {
        'name': 'Fey Step',
        'version': '0.7.01'
    },
    'Cunning Intuition': {
        'name': 'Cunning Intuition',
        'version': '0.7.01'
    },
    'Incisive Sense': {
        'name': 'Incisive Sense',
        'version': '0.7.01'
    },
    'Astral Spark': {
        'name': 'Astral Spark',
        'version': '0.7.01'
    },
    'Gnome Cunning': {
        'name': 'Gnome Cunning',
        'version': '0.7.01'
    },
    'Deductive Intuition': {
        'name': 'Deductive Intuition',
        'version': '0.7.01'
    },
    'Savage Attacks': {
        'name': 'Savage Attacks',
        'version': '0.7.01'
    },
    'Artisan\'s Intuition': {
        'name': 'Artisan\'s Intuition',
        'version': '0.7.01'
    },
    'Dual Mind': {
        'name': 'Dual Mind',
        'version': '0.7.01'
    },
    'Mental Discipline': {
        'name': 'Mental Discipline',
        'version': '0.7.01'
    },
    'Hungry Jaws': {
        'name': 'Hungry Jaws',
        'version': '0.7.01'
    },
    'Relentless Endurance': {
        'name': 'Relentless Endurance',
        'version': '0.7.01',
        'settings': [
            'Relentless Endurance'
        ]
    },
    'Natural Resilience': {
        'name': 'Natural Resilience',
        'version': '0.7.01',
        'settings': [
            'Condition Resistance'
        ]
    },
    'Blessing of the Raven Queen': {
        'name': 'Blessing of the Raven Queen',
        'version': '0.7.01'
    },
    'Shift - Wildhunt': {
        'name': 'Shift - Wildhunt',
        'version': '0.7.01',
        'settings': [
            'Wildhunt'
        ]
    },
    'Telepathic Insight': {
        'name': 'Telepathic Insight',
        'version': '0.7.01'
    },
    'Constructed Resilience': {
        'name': 'Constructed Resilience',
        'version': '0.7.01',
        'settings': [
            'Condition Resistance'
        ]
    },
    'Crusher: Critical': {
        'name': 'Crusher: Critical',
        'version': '0.7.01'
    },
    'Elemental Adept (Acid)': {
        'name': 'Elemental Adept (Acid)',
        'version': '0.7.01',
        'settings': [
            'Elemental Adept'
        ]
    },
    'Elemental Adept (Cold)': {
        'name': 'Elemental Adept (Cold)',
        'version': '0.7.01',
        'settings': [
            'Elemental Adept'
        ]
    },
    'Elemental Adept (Fire)': {
        'name': 'Elemental Adept (Fire)',
        'version': '0.7.01',
        'settings': [
            'Elemental Adept'
        ]
    },
    'Elemental Adept (Lightning)': {
        'name': 'Elemental Adept (Lightning)',
        'version': '0.7.01',
        'settings': [
            'Elemental Adept'
        ]
    },
    'Elemental Adept (Thunder)': {
        'name': 'Elemental Adept (Thunder)',
        'version': '0.7.01',
        'settings': [
            'Elemental Adept'
        ]
    },
    'Ember of the Fire Giant: Searing Ignition': {
        'name': 'Ember of the Fire Giant: Searing Ignition',
        'version': '0.7.01'
    },
    'Fury of the Frost Giant: Frigid Retaliation': {
        'name': 'Fury of the Frost Giant: Frigid Retaliation',
        'version': '0.7.01'
    },
    'Gift of the Chromatic Dragon: Chromatic Infusion': {
        'name': 'Gift of the Chromatic Dragon: Chromatic Infusion',
        'version': '0.7.01',
        'mutation': {
            'self': 'Chromatic Infusion'
        }
    },
    'Gift of the Chromatic Dragon: Reactive Resistance': {
        'name': 'Gift of the Chromatic Dragon: Reactive Resistance',
        'version': '0.7.01'
    },
    'Guile of the Cloud Giant: Cloudy Escape': {
        'name': 'Guile of the Cloud Giant: Cloudy Escape',
        'version': '0.7.01'
    },
    'Keenness of the Stone Giant: Stone Throw': {
        'name': 'Keenness of the Stone Giant: Stone Throw',
        'version': '0.7.01'
    },
    'Orcish Fury - Extra Damage': {
        'name': 'Orcish Fury - Extra Damage',
        'version': '0.7.01'
    },
    'Piercer: Critical Hit': {
        'name': 'Piercer: Critical Hit',
        'version': '0.7.01'
    },
    'Piercer: Reroll Damage': {
        'name': 'Piercer: Reroll Damage',
        'version': '0.7.01'
    },
    'Slasher: Critical Hit': {
        'name': 'Slasher: Critical Hit',
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
    'Strike of the Giants: Frost Strike': {
        'name': 'Strike of the Giants: Frost Strike',
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
    'Strike of the Giants: Storm Strike': {
        'name': 'Strike of the Giants: Storm Strike',
        'version': '0.7.01'
    },
    'Telekinetic: Shove': {
        'name': 'Telekinetic: Shove',
        'version': '0.7.01'
    },
    'Vigor of the Hill Giant: Bulwark': {
        'name': 'Vigor of the Hill Giant: Bulwark',
        'version': '0.7.01'
    },
    'Dash': {
        'name': 'Dash',
        'version': '0.7.01'
    },
    'Disengage': {
        'name': 'Disengage',
        'version': '0.7.01'
    },
    'Dodge': {
        'name': 'Dodge',
        'version': '0.7.01'
    },
    'Fall': {
        'name': 'Fall',
        'version': '0.7.01'
    },
    'Grapple': {
        'name': 'Grapple',
        'version': '0.7.01'
    },
    'Help': {
        'name': 'Help',
        'version': '0.7.01'
    },
    'Hide': {
        'name': 'Hide',
        'version': '0.7.01'
    },
    'Ready Action': {
        'name': 'Ready Action',
        'version': '0.7.01'
    },
    'Ready Spell': {
        'name': 'Ready Spell',
        'version': '0.7.01'
    },
    'Search': {
        'name': 'Search',
        'version': '0.7.01'
    },
    'Shove': {
        'name': 'Shove',
        'version': '0.7.01'
    },
    'Durable Magic': {
        'name': 'Durable Magic',
        'version': '0.7.02'
    },
    'Find Familiar': {
        'name': 'Find Familiar',
        'version': '0.7.03',
        'mutation': {
            'self': 'Find Familiar'
        }
    },
    'Eldritch Invocations: Investment of the Chain Master': {
        'name': 'Eldritch Invocations: Investment of the Chain Master',
		'version': '0.7.03',
	},
    'Underwater': {
        'name': 'Underwater',
        'version': '0.7.03'
    },
    'Squeeze': {
        'name': 'Squeeze',
        'version': '0.7.03'
    },
    'Shield of Faith': {
        'name': 'Shield of Faith',
        'version': '0.7.03'
    }
}