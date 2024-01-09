export function setConfig() {
    let summonEffectOptions = [
        {'value': 'none', 'html': 'None'},
        {'value': 'default', 'html': 'Default'},
        {'value': 'celestial', 'html': 'Celestial'},
        {'value': 'fiend', 'html': 'Fiend'},
        {'value': 'fire', 'html': 'Fire'},
        {'value': 'water', 'html': 'Water'},
        {'value': 'air', 'html': 'Air'},
        {'value': 'earth', 'html': 'Earth'},
        {'value': 'nature', 'html': 'Nature'},
        {'value': 'shadow', 'html': 'Shadow'},
        {'value': 'future', 'html': 'Future'}
    ];
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
            ],
            'Planar Wanderer': [
                'Planar Wanderer: Planar Adaptation'
            ],
            'Gunslinger': [
                'Reload Firearm',
                'Repair Firearm'
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
            'Arcane Ward': [
                'Arcane Ward - Hit Points'
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
            'Manifest Mind: Summon': [
                'Manifest Mind: Cast Spell',
                'Manifest Mind: Move'
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
            ],
            'Bestial Soul': [
                'Form of the Beast: Bite',
                'Form of the Beast: Claws',
                'Form of the Beast: Tail',
                'Form of the Beast: Tail (reaction)'
            ],
            'Cartomancer: Hidden Ace - Imbue Card': [
                'Cartomancer: Hidden Ace - Flourish Imbued Card'
            ],
            'Elemental Cleaver': [
                'Elemental Cleaver: Change Damage Type'
            ]
        },
        'restrictedItems': {
            'Bardic Inspiration 1': {
                'originalName': 'Bardic Inspiration',
                'requiredClass': 'Bard',
                'requiredSubclass': null,
                'requiredRace': null,
                'requiredEquipment': [],
                'requiredFeatures': [
                    'Magical Inspiration'
                ],
                'replacedItemName': 'Bardic Inspiration & Magical Inspiration',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
            },
            'Bardic Inspiration 2': {
                'originalName': 'Bardic Inspiration',
                'requiredClass': 'Bard',
                'requiredSubclass': 'College of Creation',
                'requiredRace': null,
                'requiredEquipment': [],
                'requiredFeatures': [
                    'Magical Inspiration',
                    'Mote of Potential'
                ],
                'replacedItemName': 'Bardic Inspiration, Magical Inspiration, & Mote of Potential',
                'removedItems': [],
                'additionalItems': [],
                'priority': 1
            },
            'Radiant Soul': {
                'originalName': 'Radiant Soul',
                'requiredClass': 'Warlock',
                'requiredSubclass': 'The Celestial',
                'requiredRace': null,
                'requiredEquipment': [],
                'requiredFeatures': [],
                'replacedItemName': 'Radiant Soul',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
            },
            'Unarmored Defense 1': {
                'originalName': 'Unarmored Defense',
                'requiredClass': 'Barbarian',
                'requiredSubclass': null,
                'requiredRace': null,
                'requiredEquipment': [],
                'requiredFeatures': [],
                'replacedItemName': 'Unarmored Defense (Barbarian)',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
            },
            'Unarmored Defense 2': {
                'originalName': 'Unarmored Defense',
                'requiredClass': 'Monk',
                'requiredSubclass': null,
                'requiredRace': null,
                'requiredEquipment': [],
                'requiredFeatures': [],
                'replacedItemName': 'Unarmored Defense (Monk)',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
            },
            'Unarmed Strike': {
                'originalName': 'Unarmed Strike',
                'requiredClass': 'Monk',
                'requiredSubclass': null,
                'requiredRace': null,
                'requiredEquipment': [],
                'requiredFeatures': [],
                'replacedItemName': 'Unarmed Strike (Monk)',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
            },
            'Mental Discipline 1': {
                'originalName': 'Mental Discipline',
                'requiredClass': null,
                'requiredSubclass': null,
                'requiredRace': 'Kalashtar',
                'requiredEquipment': [],
                'requiredFeatures': [],
                'replacedItemName': 'Mental Discipline (Kalashtar)',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
            },
            'Mental Discipline 2': {
                'originalName': 'Mental Discipline',
                'requiredClass': null,
                'requiredSubclass': null,
                'requiredRace': 'Githzerai',
                'requiredEquipment': [],
                'requiredFeatures': [],
                'replacedItemName': 'Mental Discipline (Githzerai)',
                'removedItems': [],
                'additionalItems': [],
                'priority': 0
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
            'Overchannel': {
                'system': {
                    'uses': {
                        'per': null,
                        'recovery': '',
                        'value': null
                    },
                    'consume': {
                        'amount': null,
                        'target': '',
                        'type': ''
                    }
                }
            },
            'Arcane Ward': {
                'system': {
                    'uses': {
                        'max': 1,
                        'per': 'charges',
                        'recovery': '',
                        'value': 0
                    }
                }
            }
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
                            {'value': 'dark_red', 'html': 'Red'},
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
                },
                'select': {
                    'animation-beholderkin': {
                        'label': 'Beholderkin Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    },
                    'animation-slaad': {
                        'label': 'Slaad Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    },
                    'animation-star-spawn': {
                        'label': 'Star Spawn Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-air': {
                        'label': 'Air Animation:',
                        'default': 'air',
                        'values': summonEffectOptions
                    },
                    'animation-land': {
                        'label': 'Land Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
                    },
                    'animation-water': {
                        'label': 'Water Animation:',
                        'default': 'water',
                        'values': summonEffectOptions
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
                    'avatar-avenger': {
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
                },
                'select': {
                    'animation-avenger': {
                        'label': 'Avenger Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
                    },
                    'animation-defender': {
                        'label': 'Defender Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-clay': {
                        'label': 'Clay Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
                    },
                    'animation-metal': {
                        'label': 'Metal Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
                    },
                    'animation-stone': {
                        'label': 'Stone Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-chromatic': {
                        'label': 'Chromatic Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    },
                    'animation-metallic': {
                        'label': 'Metallic Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    },
                    'animation-gem': {
                        'label': 'Gem Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-air': {
                        'label': 'Air Animation:',
                        'default': 'air',
                        'values': summonEffectOptions
                    },
                    'animation-earth': {
                        'label': 'Earth Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
                    },
                    'animation-fire': {
                        'label': 'Fire Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    },
                    'animation-water': {
                        'label': 'Water Animation:',
                        'default': 'water',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-fuming': {
                        'label': 'Fuming Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    },
                    'animation-mirthful': {
                        'label': 'Mirthful Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    },
                    'animation-tricksy': {
                        'label': 'Tricksy Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-demon': {
                        'label': 'Demon Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    },
                    'animation-devil': {
                        'label': 'Devil Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    },
                    'animation-yugoloth': {
                        'label': 'Yugoloth Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-fury': {
                        'label': 'Fury Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    },
                    'animation-despair': {
                        'label': 'Despair Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    },
                    'animation-fear': {
                        'label': 'Fear Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-ghostly': {
                        'label': 'Ghostly Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    },
                    'animation-putrid': {
                        'label': 'Putrid Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    },
                    'animation-skeletal': {
                        'label': 'Skeletal Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-acid': {
                        'label': 'Acid Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    },
                    'animation-cold': {
                        'label': 'Cold Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    },
                    'animation-fire': {
                        'label': 'Fire Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    },
                    'animation-lightning': {
                        'label': 'Lightning Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    },
                    'animation-poision': {
                        'label': 'Poision Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    }
                }
            },
            'Homunculus Servant': {
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
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation-land': {
                        'label': 'Land Animation:',
                        'default': 'earth',
                        'values': summonEffectOptions
                    },
                    'animation-sea': {
                        'label': 'Sea Animation:',
                        'default': 'water',
                        'values': summonEffectOptions
                    },
                    'animation-sky': {
                        'label': 'Sky Animation:',
                        'default': 'air',
                        'values': summonEffectOptions
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
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
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
                    },
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Change Season': {
                'checkbox': {
                    'showicon': {
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
                    'damagetype': {
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
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'dark_black', 'html': 'Black'},
                            {'value': 'dark_blue', 'html': 'Dark Blue'},
                            {'value': 'dark_purple', 'html': 'Purple'},
                            {'value': 'dark_red', 'html': 'Red'},
                            {'value': 'dark_whiteblue', 'html': 'White-Blue'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'orange', 'html': 'Orange'},
                            {'value': 'greenorange', 'html': 'Green-Orange'},
                            {'value': 'pinkpurple', 'html': 'Pink-Purple'},
                            {'value': 'random', 'html': 'Random'}
                        ]
                    },
                    'variation': {
                        'label': 'What variation?',
                        'default': 'ring',
                        'values': [
                            {'value': 'ring', 'html': 'Ring'},
                            {'value': 'no_ring', 'html': 'No Ring'},
                            {'value': 'particles', 'html': 'Particles'},
                            {'value': 'spirits', 'html': 'Spirits'}
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
                        'label': 'Disabled:',
                        'default': false
                    },
                    'spells': {
                        'label': 'Include Spellcasting:',
                        'default': true
                    }
                },
                'select': {
                    'abilities': {
                        'label': 'Abilities:',
                        'default': 'upgrade',
                        'values': [
                            {'value': 'source', 'html': 'Keep Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'upgrade', 'html': 'Upgrade'},
                            {'value': 'downgrade', 'html': 'Downgrade'}
                        ]
                    },
                    'skills': {
                        'label': 'Skills:',
                        'default': 'upgrade',
                        'values': [
                            {'value': 'source', 'html': 'Keep Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'upgrade', 'html': 'Upgrade'},
                            {'value': 'downgrade', 'html': 'Downgrade'}
                        ]
                    },
                    'avatar': {
                        'label': 'Avatar Image:',
                        'default': 'source',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'}
                        ]
                    },
                    'token': {
                        'label': 'Token Image:',
                        'default': 'source',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'}
                        ]
                    },
                    'features': {
                        'label': 'Features',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    },
                    'conditionimmunity': {
                        'label': 'Condition Immunities',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    },
                    'damageimmunity': {
                        'label': 'Damage Immunities',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    },
                    'damageresistance': {
                        'label': 'Damage Resistances',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    },
                    'damagevulnerability': {
                        'label': 'Damage Vulnerabilities',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    },
                    'languages': {
                        'label': 'Languages',
                        'default': 'merge',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'merge', 'html': 'Merge'}
                        ]
                    },
                    'name': {
                        'label': 'Name',
                        'default': 'before',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'before', 'html': 'Prepend'},
                            {'value': 'after', 'html': 'Append'}
                        ]
                    },
                    'ac': {
                        'label': 'Armor Calculation',
                        'default': 'source',
                        'values': [
                            {'value': 'source', 'html': 'Use Source'},
                            {'value': 'target', 'html': 'Keep Target'}
                        ]
                    },
                    'movement': {
                        'label': 'Movement',
                        'default': 'upgrade',
                        'values': [
                            {'value': 'source', 'html': 'Keep Source'},
                            {'value': 'target', 'html': 'Keep Target'},
                            {'value': 'upgrade', 'html': 'Upgrade'},
                            {'value': 'downgrade', 'html': 'Downgrade'}
                        ]
                    },
                    'senses': {
                        'label': 'Senses',
                        'default': 'source',
                        'values': [
                            {'value': 'source', 'html': 'Keep Source'},
                            {'value': 'target', 'html': 'Keep Target'}
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
                            {'value': 'purple', 'html': 'Purple'},
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
                            {'value': 'random', 'html': 'Random'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Guardian of Faith': {
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
                },
                'select': {
                    'color': {
                        'label': 'Animation Color:',
                        'default': 'yellow',
                        'values': [
                            {'value': 'yellow', 'html': 'Yellow'},
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'purple', 'html': 'Purple'}
                        ]
                    },
                    'animation': {
                        'label': 'Summon Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
                    }
                }
            },
            'Awakened Spellbook: Replace Damage': {
                'checkbox': {
                    'cromaticorb': {
                        'label': 'Has Chromatic Orb?',
                        'default': false
                    },
                    'magicmissile': {
                        'label': 'Has Magic Missile?',
                        'default': false
                    },
                    'dragonsbreath': {
                        'label': 'Has Dragon\'s Breath?',
                        'default': false
                    },
                    'glyphofwarding': {
                        'label': 'Has Glyph of Warding?',
                        'default': false
                    },
                    'protectionfromenergy': {
                        'label': 'Has Protection from Energy?',
                        'default': false
                    },
                    'spiritshroud': {
                        'label': 'Has Spirit Shroud?',
                        'default': false
                    },
                    'vampirictouch': {
                        'label': 'Has Vampiric Touch?',
                        'default': false
                    },
                    'elementalbane': {
                        'label': 'Has Elemental Bane?',
                        'default': false
                    },
                    'cloudkill': {
                        'label': 'Has Cloudkill?',
                        'default': false
                    },
                    'primasticspray': {
                        'label': 'Has Prismatic Spray?',
                        'default': false
                    },
                    'illusorydragon': {
                        'label': 'Has Illusory Dragon?',
                        'default': false
                    },
                    'prismaticwall': {
                        'label': 'Has Prismatic Wall?',
                        'default': false
                    }
                }
            },
            'Dancing Greatsword': {
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
            'Dancing Longsword': {
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
            'Dancing Rapier': {
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
            'Dancing Scimitar': {
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
            'Dancing Shortsword': {
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
            'Conjure Animals': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'checkbox': {
                    'overwriteInitiative': {
                        'label': 'Overwrite initiative setting? Default Seperate Initiative',
                        'default': false
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    }
                }
            },
            'Conjure Celestial': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'checkbox': {
                    'overwriteInitiative': {
                        'label': 'Overwrite initiative setting? Default Seperate Initiative',
                        'default': false
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
                    }
                }
            },
            'Conjure Elemental': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'checkbox': {
                    'overwriteInitiative': {
                        'label': 'Overwrite initiative setting? Default Seperate Initiative',
                        'default': false
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    }
                }
            },
            'Conjure Fey': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'checkbox': {
                    'overwriteInitiative': {
                        'label': 'Overwrite initiative setting? Default Seperate Initiative',
                        'default': false
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    }
                }
            },
            'Conjure Minor Elementals': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'checkbox': {
                    'overwriteInitiative': {
                        'label': 'Overwrite initiative setting? Default Seperate Initiative',
                        'default': false
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    }
                }
            },
            'Conjure Woodland Beings': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'checkbox': {
                    'overwriteInitiative': {
                        'label': 'Overwrite initiative setting? Default Seperate Initiative',
                        'default': false
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    }
                }
            },
            'Find Familiar': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    },
                    'name': {
                        'label': 'Familiar Name:',
                        'default': ''
                    }
                },
                'select': {
                    'animation-celestial': {
                        'label': 'Celestial Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
                    },
                    'animation-fey': {
                        'label': 'Fey Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    },
                    'animation-fiend': {
                        'label': 'Fiend Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    }
                }
            },
            'Crystal Greatsword': {
                'checkbox': {
                    'healprompt': {
                        'label': 'Prompt to use heal?',
                        'default': true
                    }
                }
            },
            'Crystal Longsword': {
                'checkbox': {
                    'healprompt': {
                        'label': 'Prompt to use heal?',
                        'default': true
                    }
                }
            },
            'Crystal Rapier': {
                'checkbox': {
                    'healprompt': {
                        'label': 'Prompt to use heal?',
                        'default': true
                    }
                }
            },
            'Crystal Scimitar': {
                'checkbox': {
                    'healprompt': {
                        'label': 'Prompt to use heal?',
                        'default': true
                    }
                }
            },
            'Crystal Shortsword': {
                'checkbox': {
                    'healprompt': {
                        'label': 'Prompt to use heal?',
                        'default': true
                    }
                }
            },
            'Find Steed': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    },
                    'name': {
                        'label': 'Steed Name:',
                        'default': ''
                    }
                },
                'select': {
                    'animation-celestial': {
                        'label': 'Celestial Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
                    },
                    'animation-fey': {
                        'label': 'Fey Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    },
                    'animation-fiend': {
                        'label': 'Fiend Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    }
                }
            },
            'Find Greater Steed': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    },
                    'name': {
                        'label': 'Greater Steed Name:',
                        'default': ''
                    }
                },
                'select': {
                    'animation-celestial': {
                        'label': 'Celestial Animation:',
                        'default': 'celestial',
                        'values': summonEffectOptions
                    },
                    'animation-fey': {
                        'label': 'Fey Animation:',
                        'default': 'nature',
                        'values': summonEffectOptions
                    },
                    'animation-fiend': {
                        'label': 'Fiend Animation:',
                        'default': 'fire',
                        'values': summonEffectOptions
                    }
                }
            },
            'Enhanced Weapon, +1': {
                'number': {
                    'level': {
                        'label': 'Level:',
                        'default': 1
                    }
                }
            },
            'Enhanced Weapon, +2': {
                'number': {
                    'level': {
                        'label': 'Level:',
                        'default': 2
                    }
                }
            },
            'Radiant Weapon': {
                'number': {
                    'savedc': {
                        'label': 'Save DC:',
                        'default': 10
                    }
                }
            },
            'Resistant Armor': {
                'select': {
                    'resistance': {
                        'label': 'What resistance?',
                        'default': 'acid',
                        'values': [
                            {'value': 'acid', 'html': 'Acid'},
                            {'value': 'cold', 'html': 'Cold'},
                            {'value': 'fire', 'html': 'Fire'},
                            {'value': 'force', 'html': 'Force'},
                            {'value': 'lightning', 'html': 'Lightning'},
                            {'value': 'necrotic', 'html': 'Necrotic'},
                            {'value': 'poison', 'html': 'Poison'},
                            {'value': 'psychic', 'html': 'Psychic'},
                            {'value': 'radiant', 'html': 'Radiant'},
                            {'value': 'thunder', 'html': 'Thunder'}
                        ]
                    }
                }
            },
            'Savage Attacker': {
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
            'Rage': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'lightning', 'html': 'Purple Lightning'},
                            {'value': 'saiyan', 'html': 'Super Saiyan'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Burning Hands': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Fly': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Faerie Fire': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'green',
                        'values': [
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'purple', 'html': 'Violet'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Vortex Warp': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'simple', 'html': 'Simple'}
                        ]
                    }
                }
            },
            'Disintegrate': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Fire Storm': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Fire Shield': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Far Step': {
                'select': {
                    'animation': {
                        'label': 'What animation?',
                        'default': 'default',
                        'values': [
                            {'value': 'default', 'html': 'Default'},
                            {'value': 'simple', 'html': 'Simple'}
                        ]
                    }
                }
            },
            'Shocking Grasp': {
                'select': {
                    'color': {
                        'label': 'What color?',
                        'default': 'blue',
                        'values': [
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'blue02', 'html': 'Alternate Blue'},
                            {'value': 'dark_purple', 'html': 'Dark Purple'},
                            {'value': 'dark_red', 'html': 'Dark Red'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'green02', 'html': 'Alternate Green'},
                            {'value': 'orange', 'html': 'Orange'},
                            {'value': 'purple', 'html': 'Purple'},
                            {'value': 'red', 'html': 'Red'},
                            {'value': 'yellow', 'html': 'Yellow'},
                            {'value': 'random', 'html': 'Random'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    }
                }
            },
            'Summon Lesser Demons': {
                'text': {
                    'folder': {
                        'label': 'Custom Folder:',
                        'default': ''
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    }
                }
            },
            'Manifest Mind: Summon': {
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
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    }
                }
            },
            'Parry': {
                'text': {
                    'acbonus': {
                        'label': 'AC Bonus:',
                        'default': '2'
                    }
                }
            },
            'Enlarge/Reduce': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Breath of the Dragon': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Wraps of Dyamak': {
                'select': {
                    'tier': {
                        'label': 'Tier:',
                        'default': 1,
                        'values': [
                            {'value': 1, 'html': '1'},
                            {'value': 2, 'html': '2'},
                            {'value': 3, 'html': '3'},
                        ]
                    }
                }
            },
            'Scorching Ray': {
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'complex',
                        'values': [
                            {'value': 'complex', 'html': 'Complex'},
                            {'value': 'simple', 'html': 'Simple'},
                            {'value': 'none', 'html': 'None'}
                        ]
                    },
                    'color': {
                        'label': 'Color:',
                        'default': 'orange',
                        'values': [
                            {'value': 'orange', 'html': 'Orange'},
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'pink', 'html': 'Pink'},
                            {'value': 'purple', 'html': 'Purple'},
                            {'value': 'rainbow01', 'html': 'Rainbow'},
                            {'value': 'rainbow02', 'html': 'Rainbow Alternate'},
                            {'value': 'cycle', 'html': 'Cycle'},
                            {'value': 'random', 'html': 'Random'}
                        ]
                    }
                }
            },
            'Firearm (CR)': {
                'number': {
                    'misfire': {
                        'label': 'Misfire Score:',
                        'default': 1
                    }
                },
                'select': {
                    'status': {
                        'label': 'Status:',
                        'default': 0,
                        'values': [
                            {'value': 0, 'html': 'Normal'},
                            {'value': 1, 'html': 'Damaged'},
                            {'value': 2, 'html': 'Broken'},
                        ]
                    }
                }
            },
            'Booming Blade': {
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'blue',
                        'values': [
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'blue02', 'html': 'Alternate Blue'},
                            {'value': 'dark_purple', 'html': 'Dark Purple'},
                            {'value': 'dark_red', 'html': 'Dark Red'},
                            {'value': 'green', 'html': 'Green'},
                            {'value': 'green02', 'html': 'Alternate Green'},
                            {'value': 'orange', 'html': 'Orange'},
                            {'value': 'red', 'html': 'Red'},
                            {'value': 'purple', 'html': 'Purple'},
                            {'value': 'yellow', 'html': 'Yellow'},
                            {'value': 'blue', 'html': 'Blue'},
                            {'value': 'random', 'html': 'Random'},
                            {'value': 'none', 'html': 'None'},
                        ]
                    }
                }
            },
            'Rime\'s Binding Ice': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Wild Surge': {
                'text': {
                    'flumph-avatar': {
                        'label': 'Flumph Avatar',
                        'default': ''
                    },
                    'flumph-token': {
                        'label': 'Flumph Token',
                        'default': ''
                    },
                    'pixie-avatar': {
                        'label': 'Pixie Avatar',
                        'default': ''
                    },
                    'pixie-token': {
                        'label': 'Pixie Token',
                        'default': ''
                    }
                }
            },
            'Quick Insert Summon': {
                'text': {
                    'prefill': {
                        'label': 'Prefill Text:',
                        'default': ''
                    }
                },
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'default',
                        'values': summonEffectOptions
                    }
                }
            },
            'Animate Dead': {
                'select': {
                    'animation': {
                        'label': 'Animation:',
                        'default': 'shadow',
                        'values': summonEffectOptions
                    }
                }
            },
            'Stunning Strike': {
                'checkbox': {
                    'onhit': {
                        'label': 'Prompt on hit?',
                        'default': false
                    }
                }
            },
            'Investiture of Flame': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            },
            'Investiture of Ice': {
                'checkbox': {
                    'animation': {
                        'label': 'Play Animation?',
                        'default': true
                    }
                }
            }
        },
        'automations': {
            'Armor of Agathys': {
                'name': 'Armor of Agathys',
                'version': '0.7.45',
                'settings': [
                    'On Hit'
                ],
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.15'
            },
            'Ray of Enfeeblement': {
                'name': 'Ray of Enfeeblement',
                'version': '0.7.01'
            },
            'Shocking Grasp': {
                'name': 'Shocking Grasp',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Sanctuary': {
                'name': 'Sanctuary',
                'version': '0.7.45',
                'hasAnimation': true,
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
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Tasha\'s Caustic Brew': {
                'name': 'Tasha\'s Caustic Brew',
                'version': '0.7.19'
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
                'version': '0.7.45',
                'hasAnimation': true,
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true,
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
                'version': '0.7.45',
                'hasAnimation': true
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
                    'Shadow of Moil',
                    'On Hit'
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.16',
                'actors': [
                    'CPR - Elemental Spirit'
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
                'version': '0.7.45',
                'hasAnimation': true,
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
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Lightning Arrow': {
                'name': 'Lightning Arrow',
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
            'Homunculus Servant': {
                'name': 'Homunculus Servant',
                'version': '0.7.46',
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
                'version': '0.7.45',
                'mutation': {
                    'self': 'Rage'
                },
                'hasAnimation': true
            },
            'Totem Spirit: Bear': {
                'name': 'Totem Spirit: Bear',
                'version': '0.7.33'
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.39',
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
                'version': '0.9.16'
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
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Channel Divinity: Peerless Athlete': {
                'name': 'Channel Divinity: Peerless Athlete',
                'version': '0.7.01'
            },
            'Aura of Warding': {
                'name': 'Aura of Warding',
                'version': '0.9.4',
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
                'version': '0.7.46'
            },
            'Favored by the Gods': {
                'name': 'Favored by the Gods',
                'version': '0.8.23'
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
                'version': '0.8.19'
            },
            'Genie\'s Vessel: Genie\'s Wrath (Djinni)': {
                'name': 'Genie\'s Vessel: Genie\'s Wrath (Djinni)',
                'version': '0.8.19'
            },
            'Genie\'s Vessel: Genie\'s Wrath (Efreeti)': {
                'name': 'Genie\'s Vessel: Genie\'s Wrath (Efreeti)',
                'version': '0.8.19'
            },
            'Genie\'s Vessel: Genie\'s Wrath (Marid)': {
                'name': 'Genie\'s Vessel: Genie\'s Wrath (Marid)',
                'version': '0.8.19'
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
                'version': '0.7.38'
            },
            'Form of Dread: Fear': {
                'name': 'Form of Dread: Fear',
                'version': '0.7.38'
            },
            'Grave Touched': {
                'name': 'Grave Touched',
                'version': '0.7.38'
            },
            'Awakened Spellbook: Replace Damage': {
                'name': 'Awakened Spellbook: Replace Damage',
                'version': '0.7.01'
            },
            'Arcane Ward': {
                'name': 'Arcane Ward',
                'version': '0.7.34',
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
                'version': '0.7.07'
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
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Dragon\'s Wrath Weapon (Slumbering)': {
                'name': 'Dragon\'s Wrath Weapon (Slumbering)',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Dragon\'s Wrath Weapon (Stirring)': {
                'name': 'Dragon\'s Wrath Weapon (Stirring)',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Dragon\'s Wrath Weapon (Wakened)': {
                'name': 'Dragon\'s Wrath Weapon (Wakened)',
                'version': '0.7.45',
                'hasAnimation': true
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
                'version': '0.7.53'
            },
            'Celestial Revelation (Radiant Soul)': {
                'name': 'Celestial Revelation (Radiant Soul)',
                'version': '0.7.53'
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
                'version': '0.8.23'
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
                'version': '0.7.35'
            },
            'Artisan\'s Intuition': {
                'name': 'Artisan\'s Intuition',
                'version': '0.7.01'
            },
            'Dual Mind': {
                'name': 'Dual Mind',
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
            'Slasher: Reduce Speed': {
                'name': 'Slasher: Reduce Speed',
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
                'version': '0.8.17'
            },
            'Grapple': {
                'name': 'Grapple',
                'version': '0.8.17'
            },
            'Help': {
                'name': 'Help',
                'version': '0.8.17'
            },
            'Hide': {
                'name': 'Hide',
                'version': '0.8.17'
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
                'version': '0.8.17'
            },
            'Shove': {
                'name': 'Shove',
                'version': '0.8.17'
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
                'version': '0.8.17'
            },
            'Squeeze': {
                'name': 'Squeeze',
                'version': '0.7.03'
            },
            'Shield of Faith': {
                'name': 'Shield of Faith',
                'version': '0.7.03'
            },
            'Grease': {
                'name': 'Grease',
                'version': '0.7.04',
                'settings': [
                    'Template Listener'
                ]
            },
            'Dash': {
                'name': 'Dash',
                'version': '0.7.11'
            },
            'Disengage': {
                'name': 'Disengage',
                'version': '0.7.11'
            },
            'Dodge': {
                'name': 'Dodge',
                'version': '0.7.11'
            },
            'Fall': {
                'name': 'Fall',
                'version': '0.7.11'
            },
            'Grapple': {
                'name': 'Grapple',
                'version': '0.7.11'
            },
            'Help': {
                'name': 'Help',
                'version': '0.7.11'
            },
            'Hide': {
                'name': 'Hide',
                'version': '0.7.11'
            },
            'Ready Action': {
                'name': 'Ready Action',
                'version': '0.7.11'
            },
            'Ready Spell': {
                'name': 'Ready Spell',
                'version': '0.7.11'
            },
            'Search': {
                'name': 'Search',
                'version': '0.7.11'
            },
            'Shove': {
                'name': 'Shove',
                'version': '0.7.11'
            },
            'Squeeze': {
                'name': 'Squeeze',
                'version': '0.7.11'
            },
            'Underwater': {
                'name': 'Underwater',
                'version': '0.7.11'
            },
            'Sculpt Spells': {
                'name': 'Sculpt Spells',
                'version': '0.7.12'
            },
            'Potent Cantrip': {
                'name': 'Potent Cantrip',
                'version': '0.7.12'
            },
            'Empowered Evocation': {
                'name': 'Empowered Evocation',
                'version': '0.9.9'
            },
            'Overchannel': {
                'name': 'Overchannel',
                'version': '0.7.12'
            },
            'Aura of Devotion': {
                'name': 'Aura of Devotion',
                'version': '0.7.13',
                'settings': [
                    'Effect Auras'
                ]
            },
            'Channel Divinity: Sacred Weapon': {
                'name': 'Channel Divinity: Sacred Weapon',
                'version': '0.7.13',
                'mutation': {
                    'self': 'Sacred Weapon'
                }
            },
            'Holy Nimbus': {
                'name': 'Holy Nimbus',
                'version': '0.7.13',
                'settings': [
                    'Save Patching'
                ]
            },
            'Purity of Spirit': {
                'name': 'Purity of Spirit',
                'version': '0.7.13',
                'settings': [
                    'Protection from Evil and Good'
                ]
            },
            'Crystal Greatsword': {
                'name': 'Crystal Greatsword',
                'version': '0.9.9'
            },
            'Crystal Longsword': {
                'name': 'Crystal Longsword',
                'version': '0.9.9'
            },
            'Crystal Rapier': {
                'name': 'Crystal Rapier',
                'version': '0.9.9'
            },
            'Crystal Scimitar': {
                'name': 'Crystal Scimitar',
                'version': '0.9.9'
            },
            'Crystal Shortsword': {
                'name': 'Crystal Shortsword',
                'version': '0.9.9'
            },
            'Find Steed': {
                'name': 'Find Steed',
                'version': '0.7.14'
            },
            'Find Greater Steed': {
                'name': 'Find Greater Steed',
                'version': '0.7.14'
            },
            'Arcane Propulsion Armor': {
                'name': 'Arcane Propulsion Armor',
                'version': '0.7.14'
            },
            'Armor of Magical Strength': {
                'name': 'Armor of Magical Strength',
                'version': '0.7.14'
            },
            'Boots of the Winding Path': {
                'name': 'Boots of the Winding Path',
                'version': '0.7.15'
            },
            'Wand of the War Mage, +1': {
                'name': 'Wand of the War Mage, +1',
                'version': '0.7.15'
            },
            'Wand of the War Mage, +2': {
                'name': 'Wand of the War Mage, +2',
                'version': '0.7.15'
            },
            'Wand of the War Mage, +3': {
                'name': 'Wand of the War Mage, +3',
                'version': '0.7.15'
            },
            'Enhanced Arcane Focus, +1': {
                'name': 'Enhanced Arcane Focus, +1',
                'version': '0.7.15'
            },
            'Enhanced Arcane Focus, +2': {
                'name': 'Enhanced Arcane Focus, +2',
                'version': '0.7.15'
            },
            'Enhanced Weapon, +1': {
                'name': 'Enhanced Weapon, +1',
                'version': '0.7.16'
            },
            'Enhanced Weapon, +2': {
                'name': 'Enhanced Weapon, +2',
                'version': '0.7.16'
            },
            'Radiant Weapon': {
                'name': 'Radiant Weapon',
                'version': '0.9.24'
            },
            'Repeating Shot': {
                'name': 'Repeating Shot',
                'version': '0.7.18'
            },
            'Repulsion Shield': {
                'name': 'Repulsion Shield',
                'version': '0.7.18'
            },
            'Resistant Armor': {
                'name': 'Resistant Armor',
                'version': '0.7.18'
            },
            'Returning Weapon': {
                'name': 'Returning Weapon',
                'version': '0.7.18'
            },
            'Backbreaker': {
                'name': 'Backbreaker',
                'version': '0.8.28'
            },
            'Brace': {
                'name': 'Brace',
                'version': '0.8.28'
            },
            'Cleave': {
                'name': 'Cleave',
                'version': '0.8.28'
            },
            'Concussive Smash': {
                'name': 'Concussive Smash',
                'version': '0.8.28'
            },
            'Maiming Strike': {
                'name': 'Maiming Strike',
                'version': '0.8.28'
            },
            'Flourish': {
                'name': 'Flourish',
                'version': '0.8.28'
            },
            'Heartstopper': {
                'name': 'Heartstopper',
                'version': '0.8.28'
            },
            'Lacerate': {
                'name': 'Lacerate',
                'version': '0.8.28'
            },
            'Piercing Strike': {
                'name': 'Piercing Strike',
                'version': '0.8.28'
            },
            'Piercing Shot': {
                'name': 'Piercing Shot',
                'version': '0.8.28'
            },
            'Pommel Strike': {
                'name': 'Pommel Strike',
                'version': '0.8.28'
            },
            'Prepare': {
                'name': 'Prepare',
                'version': '0.8.28'
            },
            'Rush Attack': {
                'name': 'Rush Attack',
                'version': '0.8.28'
            },
            'Tenacity': {
                'name': 'Tenacity',
                'version': '0.8.28'
            },
            'Topple': {
                'name': 'Topple',
                'version': '0.8.28'
            },
            'Hamstring Shot': {
                'name': 'Hamstring Shot',
                'version': '0.8.28'
            },
            'Mobile Shot': {
                'name': 'Mobile Shot',
                'version': '0.8.28'
            },
            'Weakening Strike': {
                'name': 'Weakening Strike',
                'version': '0.8.28'
            },
            'Tasha\'s Otherworldly Guise': {
                'name': 'Tasha\'s Otherworldly Guise',
                'version': '0.7.22'
            },
            'Guardian of Nature': {
                'name': 'Guardian of Nature',
                'version': '0.7.27'
            },
            'Lucky Footwork': {
                'name': 'Lucky Footwork',
                'version': '0.8.19'
            },
            'Relentless': {
                'name': 'Relentless',
                'version': '0.7.27'
            },
            'Insect Plague': {
                'name': 'Insect Plague',
                'version': '0.7.27',
                'settings': [
                    'Template Listener'
                ]
            },
            'Savage Attacker': {
                'name': 'Savage Attacker',
                'version': '0.7.28'
            },
            'Crusher': {
                'name': 'Crusher',
                'version': '0.7.29'
            },
            'Burning Hands': {
                'name': 'Burning Hands',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Fly': {
                'name': 'Fly',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Faerie Fire': {
                'name': 'Faerie Fire',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Disintegrate': {
                'name': 'Disintegrate',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Form of the Beast': {
                'name': 'Form of the Beast',
                'version': '0.7.33'
            },
            'Bestial Soul': {
                'name': 'Bestial Soul',
                'version': '0.7.33'
            },
            'Infectious Fury': {
                'name': 'Infectious Fury',
                'version': '0.7.33'
            },
            'Call the Hunt': {
                'name': 'Call the Hunt',
                'version': '0.8.18'
            },
            'Fire Storm': {
                'name': 'Fire Storm',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Teleport': {
                'name': 'Teleport',
                'version': '0.7.35'
            },
            'Fire Shield': {
                'name': 'Fire Shield',
                'version': '0.7.45',
                'settings': [
                    'On Hit'
                ],
                'mutation': {
                    'self': 'Fire Shield'
                },
                'hasAnimation': true
            },
            'Far Step': {
                'name': 'Far Step',
                'version': '0.7.45',
                'mutation': {
                    'self': 'Far Step'
                },
                'hasAnimation': true
            },
            'Summon Lesser Demons': {
                'name': 'Summon Lesser Demons',
                'version': '0.7.45',
                'hasAnimation': true,
                'mutation': {
                    'self': 'Summon Lesser Demons'
                }
            },
            'Manifest Mind: Summon': {
                'name': 'Manifest Mind: Summon',
                'version': '0.7.44',
                'actors': [
                    'CPR - Manifest Mind'
                ],
                'mutation': {
                    'self': 'Manifest Mind'
                },
                'settings': [
                    'Rest Listener'
                ],
            },
            'Enlarge/Reduce': {
                'name': 'Enlarge/Reduce',
                'version': '0.7.45',
                'mutation': {
                    'target': 'Enlarge/Reduce'
                },
                'hasAnimation': true
            },
            'Frost Fingers': {
                'name': 'Frost Fingers',
                'version': '0.7.45',
                'hasAnimation': true
            },
            'Eye for Weakness': {
                'name': 'Eye for Weakness',
                'version': '0.7.46'
            },
            'Insightful Fighting': {
                'name': 'Insightful Fighting',
                'version': '0.7.46'
            },
            'Soul of the Storm Giant: Maelstrom Aura': {
                'name': 'Soul of the Storm Giant: Maelstrom Aura',
                'version': '0.7.46'
            },
            'Agent of Order: Stasis Strike': {
                'name': 'Agent of Order: Stasis Strike',
                'version': '0.7.46'
            },
            'Baleful Scion: Grasp of Avarice': {
                'name': 'Baleful Scion: Grasp of Avarice',
                'version': '0.7.46'
            },
            'Righteous Heritor: Soothe Pain': {
                'name': 'Righteous Heritor: Soothe Pain',
                'version': '0.7.46',
                'settings': [
                    'Righteous Heritor'
                ]
            },
            'Planar Wanderer: Planar Adaptation': {
                'name': 'Planar Wanderer: Planar Adaptation',
                'version': '0.7.46'
            },
            'Planar Wanderer: Portal Cracker': {
                'name': 'Planar Wanderer: Portal Cracker',
                'version': '0.7.46'
            },
            'Scion of the Outer Planes (Chaotic Outer Plane)': {
                'name': 'Scion of the Outer Planes (Chaotic Outer Plane)',
                'version': '0.7.46'
            },
            'Scion of the Outer Planes (Evil Outer Plane)': {
                'name': 'Scion of the Outer Planes (Evil Outer Plane)',
                'version': '0.7.46'
            },
            'Scion of the Outer Planes (Good Outer Plane)': {
                'name': 'Scion of the Outer Planes (Good Outer Plane)',
                'version': '0.7.46'
            },
            'Scion of the Outer Planes (Lawful Outer Plane)': {
                'name': 'Scion of the Outer Planes (Lawful Outer Plane)',
                'version': '0.7.46'
            },
            'Scion of the Outer Planes (The Outlands)': {
                'name': 'Scion of the Outer Planes (The Outlands)',
                'version': '0.7.46'
            },
            'Blood Curse of Binding': {
                'name': 'Blood Curse of Binding',
                'version': '0.7.46'
            },
            'Compelled Duel': {
                'name': 'Compelled Duel',
                'version': '0.7.47',
                'settings': [
                    'Compelled Duel'
                ]
            },
            'Draconic Cry': {
                'name': 'Draconic Cry',
                'version': '0.7.47'
            },
            'Divine Fury: Necrotic': {
                'name': 'Divine Fury: Necrotic',
                'version': '0.7.53'
            },
            'Divine Fury: Radiant': {
                'name': 'Divine Fury: Radiant',
                'version': '0.7.53'
            },
            'Healing Hands': {
                'name': 'Healing Hands',
                'version': '0.7.54'
            },
            'Channel Divinity: Charm Animals and Plants': {
                'name': 'Channel Divinity: Charm Animals and Plants',
                'version': '0.7.54'
            },
            'Unarmed Strike (Monk)': {
                'name': 'Unarmed Strike (Monk)',
                'version': '0.7.54'
            },
            'Draconic Strike': {
                'name': 'Draconic Strike',
                'version': '0.7.54'
            },
            'Breath of the Dragon': {
                'name': 'Breath of the Dragon',
                'version': '0.7.54'
            },
            'Ki Points': {
                'name': 'Ki Points',
                'version': '0.7.54'
            },
            'Augment Breath': {
                'name': 'Augment Breath',
                'version': '0.7.54'
            },
            'Wraps of Dyamak':  {
                'name': 'Wraps of Dyamak',
                'version': '0.8.04'
            },
            'Hunger of Hadar': {
                'name': 'Hunger of Hadar',
                'version': '0.8.11',
                'settings': [
                    'Template Listener'
                ]
            },
            'Labyrinthine Recall': {
                'name': 'Labyrinthine Recall',
                'version': '0.8.11',
                'settings': [
                    'Skill Patching'
                ]
            },
            'Harness Divine Power': {
                'name': 'Harness Divine Power',
                'version': '0.8.13'
            },
            'Aura of Life': {
                'name': 'Aura of Life',
                'version': '0.8.13',
                'settings': [
                    'Aura of Life'
                ]
            },
            'Spider Climb': {
                'name': 'Spider Climb',
                'version': '0.8.13'
            },
            'Acid Breath Weapon': {
                'name': 'Acid Breath Weapon',
                'version': '0.8.13'
            },
            'Lightning Breath Weapon': {
                'name': 'Lightning Breath Weapon',
                'version': '0.8.13'
            },
            'Poison Breath Weapon': {
                'name': 'Poison Breath Weapon',
                'version': '0.8.13'
            },
            'Fire Breath Weapon': {
                'name': 'Fire Breath Weapon',
                'version': '0.8.13'
            },
            'Cold Breath Weapon': {
                'name': 'Cold Breath Weapon',
                'version': '0.8.13'
            },
            'Chromatic Warding (Acid)': {
                'name': 'Chromatic Warding (Acid)',
                'version': '0.8.13'
            },
            'Chromatic Warding (Cold)': {
                'name': 'Chromatic Warding (Cold)',
                'version': '0.8.13'
            },
            'Chromatic Warding (Fire)': {
                'name': 'Chromatic Warding (Fire)',
                'version': '0.8.13'
            },
            'Chromatic Warding (Lightning)': {
                'name': 'Chromatic Warding (Lightning)',
                'version': '0.8.13'
            },
            'Chromatic Warding (Poison)': {
                'name': 'Chromatic Warding (Poison)',
                'version': '0.8.13'
            },
            'Breath Weapon (Black)': {
                'name': 'Breath Weapon (Black)',
                'version': '0.8.13'
            },
            'Breath Weapon (Blue)': {
                'name': 'Breath Weapon (Blue)',
                'version': '0.8.13'
            },
            'Breath Weapon (Brass)': {
                'name': 'Breath Weapon (Brass)',
                'version': '0.8.13'
            },
            'Breath Weapon (Bronze)': {
                'name': 'Breath Weapon (Bronze)',
                'version': '0.8.13'
            },
            'Breath Weapon (Copper)': {
                'name': 'Breath Weapon (Copper)',
                'version': '0.8.13'
            },
            'Breath Weapon (Gold)': {
                'name': 'Breath Weapon (Gold)',
                'version': '0.8.13'
            },
            'Breath Weapon (Green)': {
                'name': 'Breath Weapon (Green)',
                'version': '0.8.13'
            },
            'Breath Weapon (Red)': {
                'name': 'Breath Weapon (Red)',
                'version': '0.8.13'
            },
            'Breath Weapon (Silver)': {
                'name': 'Breath Weapon (Silver)',
                'version': '0.8.13'
            },
            'Breath Weapon (White)': {
                'name': 'Breath Weapon (White)',
                'version': '0.8.13'
            },
            'Forceful Presence': {
                'name': 'Forceful Presence',
                'version': '0.8.13'
            },
            'Gem Flight': {
                'name': 'Gem Flight',
                'version': '0.8.13'
            },
            'Breath Weapon (Force)': {
                'name': 'Breath Weapon (Force)',
                'version': '0.8.13'
            },
            'Breath Weapon (Necrotic)': {
                'name': 'Breath Weapon (Necrotic)',
                'version': '0.8.13'
            },
            'Breath Weapon (Psychic)': {
                'name': 'Breath Weapon (Psychic)',
                'version': '0.8.13'
            },
            'Breath Weapon (Radiant)': {
                'name': 'Breath Weapon (Radiant)',
                'version': '0.8.13'
            },
            'Breath Weapon (Thunder)': {
                'name': 'Breath Weapon (Thunder)',
                'version': '0.8.13'
            },
            'Metallic Breath Weapon': {
                'name': 'Metallic Breath Weapon',
                'version': '0.8.16'
            },
            'Warder\'s Intuition': {
                'name': 'Warder\'s Intuition',
                'version': '0.8.16'
            },
            'Check Cover': {
                'name': 'Check Cover',
                'version': '0.8.17'
            },
            'Adept Marksman': {
                'name': 'Adept Marksman',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Bullying Shot': {
                'name': 'Bullying Shot',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Dazing Shot': {
                'name': 'Dazing Shot',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Deadeye Shot': {
                'name': 'Deadeye Shot',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Disarming Shot': {
                'name': 'Disarming Shot',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Forceful Shot': {
                'name': 'Forceful Shot',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Winging Shot': {
                'name': 'Winging Shot',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Hemorrhaging Critical': {
                'name': 'Hemorrhaging Critical',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Quickdraw': {
                'name': 'Quickdraw',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Reload Firearm': {
                'name': 'Reload Firearm',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Repair Firearm': {
                'name': 'Repair Firearm',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Vicious Intent': {
                'name': 'Vicious Intent',
                'version': '0.8.21',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Firearm (CR)': {
                'name': 'Firearm (CR)',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Lightning Reload': {
                'name': 'Lightning Reload',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Rapid Repair': {
                'name': 'Rapid Repair',
                'version': '0.8.20',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Violent Shot': {
                'name': 'Violent Shot',
                'version': '0.8.21',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Thunderwave': {
                'name': 'Thunderwave',
                'version': '0.8.25'
            },
            'Flame Blade': {
                'name': 'Flame Blade',
                'version': '0.8.22',
                'mutation': {
                    'self': 'Flame Blade'
                }
            },
            'Hidden Step': {
                'name': 'Hidden Step',
                'version': '0.8.22'
            },
            'Synaptic Static': {
                'name': 'Synaptic Static',
                'version': '0.8.23',
                'settings': [
                    'Active Effect Additions'
                ]
            },
            'Booming Blade': {
                'name': 'Booming Blade',
                'version': '0.8.26',
                'settings': [
                    'Booming Blade'
                ],
                'hasAnimation': true
            },
            'Green-Flame Blade': {
                'name': 'Green-Flame Blade',
                'version': '0.8.26'
            },
            'Spray of Cards': {
                'name': 'Spray of Cards',
                'version': '0.8.28'
            },
            'Antagonize': {
                'name': 'Antagonize',
                'version': '0.8.28'
            },
            'Cartomancer: Hidden Ace - Imbue Card': {
                'name': 'Cartomancer: Hidden Ace - Imbue Card',
                'version': '0.8.30',
                'mutation': {
                    'self': 'Cartomancer'
                }
            },
            'Astral Knowledge': {
                'name': 'Astral Knowledge',
                'version': '0.8.31'
            },
            'Mental Discipline (Githzerai)': {
                'name': 'Mental Discipline (Githzerai)',
                'version': '0.8.31'
            },
            'Mental Discipline (Kalashtar)': {
                'name': 'Mental Discipline (Kalashtar)',
                'version': '0.8.31'
            },
            'Thunderous Smite': {
                'name': 'Thunderous Smite',
                'version': '0.9.2'
            },
            'Rime\'s Binding Ice': {
                'name': 'Rime\'s Binding Ice',
                'version': '0.9.3',
                'hasAnimation': true
            },
            'Ice Storm': {
                'name': 'Ice Storm',
                'version': '0.9.3',
                'hasAnimation': true
            },
            'Searing Smite': {
                'name': 'Searing Smite',
                'version': '0.9.4'
            },
            'Wild Surge': {
                'name': 'Wild Surge',
                'version': '0.9.5',
                'actors': [
                    'CPR - Intangible Spirit'
                ]
            },
            'Controlled Surge': {
                'name': 'Controlled Surge',
                'version': '0.9.5'
            },
            'Unstable Backlash': {
                'name': 'Unstable Backlash',
                'version': '0.9.5'
            },
            'Bolstering Magic': {
                'name': 'Bolstering Magic',
                'version': '0.9.5'
            },
            'Piercing Shot CR': {
                'name': 'Piercing Shot CR',
                'version': '0.9.6',
                'settings': [
                    'Critical Role Firearm Support'
                ]
            },
            'Borrowed Knowledge': {
                'name': 'Borrowed Knowledge',
                'version': '0.9.6'
            },
            'Skill Empowerment': {
                'name': 'Skill Empowerment',
                'version': '0.9.6'
            },
            'Quick Insert Summon': {
                'name': 'Quick Insert Summon',
                'version': '0.9.10'
            },
            'Sleet Storm': {
                'name': 'Sleet Storm',
                'version': '0.9.14',
                'settings': [
                    'Template Listener'
                ]
            },
            'Giant\'s Havoc: Crushing Throw': {
                'name': 'Giant\'s Havoc: Crushing Throw',
                'version': '0.9.17'
            },
            'Giant\'s Havoc: Giant Stature': {
                'name': 'Giant\'s Havoc: Giant Stature',
                'version': '0.9.17'
            },
            'Demiurgic Colossus': {
                'name': 'Demiurgic Colossus',
                'version': '0.9.17'
            },
            'Elemental Cleaver': {
                'name': 'Elemental Cleaver',
                'version': '0.9.17',
                'mutation': {
                    'self': 'Elemental Cleaver'
                }
            },
            'Mighty Impel': {
                'name': 'Mighty Impel',
                'version': '0.9.17'
            },
            'Investiture of Flame': {
                'name': 'Investiture of Flame',
                'version': '0.9.22',
                'mutation': {
                    'self': 'Investiture of Flame'
                }
            },
            'Investiture of Ice': {
                'name': 'Investiture of Ice',
                'version': '0.9.22',
                'mutation': {
                    'self': 'Investiture of Ice'
                }
            },
            'Investiture of Stone': {
                'name': 'Investiture of Stone',
                'version': '0.9.22',
                'mutation': {
                    'self': 'Investiture of Stone'
                }
            },
            'Create Pact Weapon': {
                'name': 'Create Pact Weapon',
                'version': '0.9.24'
            },
            'Pact Boon: Pact of the Blade': {
                'name': 'Pact Boon: Pact of the Blade',
                'version': '0.9.24'
            },
            'Eldritch Invocations: Improved Pact Weapon': {
                'name': 'Eldritch Invocations: Improved Pact Weapon',
                'version': '0.9.24'
            },
            'Hex Warrior': {
                'name': 'Hex Warrior',
                'version': '0.9.24'
            }
        }
    });
}