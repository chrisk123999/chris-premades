import {chris} from '../helperFunctions.js';
export let allRaces = {
    'aarakocra': 
    {
        'name': 'Aarakocra',
        'weight': 5,
        'enabled': true,
        'monster': 'Aarakocra'
    },
    'fallen-aasimar': 
    {
        'name': 'Fallen Aasimar',
        'weight': 5,
        'enabled': true,
        'features': [
            {
                'name': 'Healing Hands',
                'description': 'Healing Hands'
            },
            {
                'name': 'Light Bearer',
                'spellcasting': true
            },
            {
                'name': 'Celestial Revelation (Necrotic Shroud)',
                'description': 'Celestial Revelation',
                'level': 3
            },
            {
                'name': 'Celestial Resistance',
                'description': 'Celestial Resistance (Aasimar)'
            }
        ],
        'dr': [
            'necrotic',
            'radiant'
        ],
        'languages': [
            'celestial'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'spells': [
            {
                'name': 'Light',
                'ability': 'cha'
            }
        ],
        'abilities': {
            'cha': 2,
            'str': 1
        }
    },
    'protector-aasimar': 
    {
        'name': 'Protector Aasimar',
        'weight': 5,
        'enabled': true,
        'features': [
            {
                'name': 'Healing Hands',
                'description': 'Healing Hands'
            },
            {
                'name': 'Light Bearer',
                'spellcasting': true
            },
            {
                'name': 'Celestial Revelation (Radiant Soul)',
                'description': 'Celestial Revelation',
                'level': 3
            },
            {
                'name': 'Celestial Resistance',
                'description': 'Celestial Resistance (Aasimar)'
            }
        ],
        'dr': [
            'necrotic',
            'radiant'
        ],
        'dr': [
            'necrotic',
            'radiant'
        ],
        'languages': [
            'celestial'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'spells': [
            {
                'name': 'Light',
                'ability': 'cha'
            }
        ],
        'abilities': {
            'cha': 2,
            'wis': 1
        }
    },
    'scourge-aasimar': 
    {
        'name': 'Scourge Aasimar',
        'weight': 5,
        'enabled': true,
        'features': [
            {
                'name': 'Healing Hands',
                'description': 'Healing Hands'
            },
            {
                'name': 'Light Bearer',
                'spellcasting': true
            },
            {
                'name': 'Celestial Revelation (Radiant Consumption)',
                'description': 'Celestial Revelation',
                'level': 3
            },
            {
                'name': 'Celestial Resistance',
                'description': 'Celestial Resistance (Aasimar)'
            }
        ],
        'dr': [
            'necrotic',
            'radiant'
        ],
        'dr': [
            'necrotic',
            'radiant'
        ],
        'languages': [
            'celestial'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'spells': [
            {
                'name': 'Light',
                'ability': 'cha'
            }
        ],
        'abilities': {
            'cha': 2,
            'con': 1
        }
    },
    'air-genasi': 
    {
        'name': 'Air Genasi',
        'weight': 25,
        'enabled': true,
        'features': [
            {
                'name': 'Unending Breath'
            },
            {
                'name': 'Mingle with the Wind',
                'spellcasting': true
            },
            {
                'name': 'Lightning Resistance'
            }
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'movement': {
            'walk': 35
        },
        'dr': [
            'lightning'
        ],
        'spells': [
            {
                'name': 'Shocking Grasp'
            },
            {
                'name': 'Feather Fall',
                'level': 3,
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            },
            {
                'name': 'Levitate',
                'level': 5,
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            },
            {
                'name': 'Feather Fall',
                'level': 3
            },
            {
                'name': 'Levitate',
                'level': 5
            }
        ],
        'languages': [
            'primordial',
            'auran'
        ],
        'abilities': {
            'con': 2,
            'dex': 1
        }
    },
    'astral-elf': 
    {
        'name': 'Astral Elf',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Starlight Step',
                'description': 'Starlight Step',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Astral Elf)'
            },
            {
                'name': 'Astral Trance',
                'description': 'Astral Trance'
            },
            {
                'name': 'Astral Fire',
                'spellcasting': true
            },
            {
                'name': 'Keen Senses'
            }
        ],
        'spells': [
            {
                'name': 'Dancing Lights'
            },
            {
                'name': 'Light'
            },
            {
                'name': 'Sacred Flame'
            }
        ],
        'languages': [
            'elvish'
        ]
    },
    'autognome': 
    {
        'name': 'Autognome',
        'weight': 5,
        'enabled': false,
        'monster': 'Autognome'
    },
    'bugbear': 
    {
        'name': 'Bugbear',
        'weight': 25,
        'enabled': true,
        'monster': 'Bugbear'
    },
    'centaur': 
    {
        'name': 'Centaur',
        'weight': 25,
        'enabled': true,
        'monster': 'Centaur'
    },
    'changeling': 
    {
        'name': 'Changeling',
        'weight': 5,
        'enabled': true,
        'monster': 'Changeling'
    },
    'deep-gnome': 
    {
        'name': 'Deep Gnome',
        'weight': 25,
        'enabled': true,
        'monster': 'Deep Gnome (Svirfneblin)'
    },
    'dhampir': 
    {
        'name': 'Dhampir',
        'weight': 5,
        'enabled': false,
        'movement': {
            'walk': 35
        },
        'senses': {
            'darkvision': 60
        },
        'features': [
            {
                'name': 'Deathless Nature'
            },
            {
                'name': 'Spider Climb',
                'description': 'Spider Climb'
            },
            {
                'name': 'Vampiric Bite',
                'description': 'Vampiric Bite',
                'uses': {
                    'max': '@prof'
                }
            }
        ],
        'abilities': {
            'dex': 2,
            'int': 1
        }
    },
    'black-chromatic-dragonborn':
    {
        'name': 'Black Chromatic Dragonborn',
        'weight': 10,
        'enabled': false,
        'features': [
            {
                'name': 'Chromatic Ancestry',
                'description': 'Chromatic Ancestry'
            },
            {
                'name': 'Draconic Resistance',
                'description': 'Draconic Resistance (Chromatic Dragonborn)'
            },
            {
                'name': 'Acid Breath Weapon',
                'description': 'Breath Weapon (Chromatic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Chromatic Warding (Acid)',
                'description': 'Chromatic Warding'
            }
        ],
        'dr': [
            'acid'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'blue-chromatic-dragonborn':
    {
        'name': 'Blue Chromatic Dragonborn',
        'weight': 10,
        'enabled': false,
        'features': [
            {
                'name': 'Chromatic Ancestry',
                'description': 'Chromatic Ancestry'
            },
            {
                'name': 'Draconic Resistance',
                'description': 'Draconic Resistance (Chromatic Dragonborn)'
            },
            {
                'name': 'Lightning Breath Weapon',
                'description': 'Breath Weapon (Chromatic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Chromatic Warding (Lightning)',
                'description': 'Chromatic Warding'
            }
        ],
        'dr': [
            'lightning'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'green-chromatic-dragonborn':
    {
        'name': 'Green Chromatic Dragonborn',
        'weight': 10,
        'enabled': false,
        'features': [
            {
                'name': 'Chromatic Ancestry',
                'description': 'Chromatic Ancestry'
            },
            {
                'name': 'Draconic Resistance',
                'description': 'Draconic Resistance (Chromatic Dragonborn)'
            },
            {
                'name': 'Poision Breath Weapon',
                'description': 'Breath Weapon (Chromatic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Chromatic Warding (Poision)',
                'description': 'Chromatic Warding'
            }
        ],
        'dr': [
            'poision'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'red-chromatic-dragonborn':
    {
        'name': 'Red Chromatic Dragonborn',
        'weight': 10,
        'enabled': false,
        'features': [
            {
                'name': 'Chromatic Ancestry',
                'description': 'Chromatic Ancestry'
            },
            {
                'name': 'Draconic Resistance',
                'description': 'Draconic Resistance (Chromatic Dragonborn)'
            },
            {
                'name': 'Fire Breath Weapon',
                'description': 'Breath Weapon (Chromatic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Chromatic Warding (Fire)',
                'description': 'Chromatic Warding'
            }
        ],
        'dr': [
            'fire'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'white-chromatic-dragonborn':
    {
        'name': 'White Chromatic Dragonborn',
        'weight': 10,
        'enabled': false,
        'features': [
            {
                'name': 'Chromatic Ancestry',
                'description': 'Chromatic Ancestry'
            },
            {
                'name': 'Draconic Resistance',
                'description': 'Draconic Resistance (Chromatic Dragonborn)'
            },
            {
                'name': 'Cold Breath Weapon',
                'description': 'Breath Weapon (Chromatic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Chromatic Warding (Cold)',
                'description': 'Chromatic Warding'
            }
        ],
        'dr': [
            'Cold'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'black-draconblood-dragonborn':
    {
        'name': 'Black Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Black)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'blue-draconblood-dragonborn':
    {
        'name': 'Blue Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Blue)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'brass-draconblood-dragonborn':
    {
        'name': 'Brass Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Brass)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'bronze-draconblood-dragonborn':
    {
        'name': 'Bronze Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Bronze)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'copper-draconblood-dragonborn':
    {
        'name': 'Copper Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Copper)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'gold-draconblood-dragonborn':
    {
        'name': 'Gold Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Gold)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'green-draconblood-dragonborn':
    {
        'name': 'Green Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Green)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'red-draconblood-dragonborn':
    {
        'name': 'Red Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Red)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'silver-draconblood-dragonborn':
    {
        'name': 'Silver Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Silver)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'white-draconblood-dragonborn':
    {
        'name': 'White Draconblood Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (White)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Forceful Presence',
                'description': 'Forceful Presence'
            },
            {
                'name': 'Draconic Ancestry'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'amethyst-gem-dragonborn':
    {
        'name': 'Amethyst Gem Dragonborn',
        'weight': 2,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Force)',
                'description': 'Breath Weapon (Gem Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Gem Dragonborn)'
            },
            {
                'name': 'Psionic Mind'
            },
            {
                'name': 'Gem Flight',
                'description': 'Gem Flight',
                'level': 5
            }
        ],
        'dr': [
            'force'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'crystal-gem-dragonborn':
    {
        'name': 'Crystal Gem Dragonborn',
        'weight': 2,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Radiant)',
                'description': 'Breath Weapon (Gem Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Gem Dragonborn)'
            },
            {
                'name': 'Psionic Mind'
            },
            {
                'name': 'Gem Flight',
                'description': 'Gem Flight',
                'level': 5
            }
        ],
        'dr': [
            'radiant'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'emerald-gem-dragonborn':
    {
        'name': 'Emerald Gem Dragonborn',
        'weight': 2,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Psychic)',
                'description': 'Breath Weapon (Gem Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Gem Dragonborn)'
            },
            {
                'name': 'Psionic Mind'
            },
            {
                'name': 'Gem Flight',
                'description': 'Gem Flight',
                'level': 5
            }
        ],
        'dr': [
            'psychic'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'sapphire-gem-dragonborn':
    {
        'name': 'Sapphire Gem Dragonborn',
        'weight': 2,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Thunder)',
                'description': 'Breath Weapon (Gem Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Gem Dragonborn)'
            },
            {
                'name': 'Psionic Mind'
            },
            {
                'name': 'Gem Flight',
                'description': 'Gem Flight',
                'level': 5
            }
        ],
        'dr': [
            'thunder'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'topaz-gem-dragonborn':
    {
        'name': 'Topaz Gem Dragonborn',
        'weight': 2,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Necrotic)',
                'description': 'Breath Weapon (Gem Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Gem Dragonborn)'
            },
            {
                'name': 'Psionic Mind'
            },
            {
                'name': 'Gem Flight',
                'description': 'Gem Flight',
                'level': 5
            }
        ],
        'dr': [
            'necrotic'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'brass-metallic-dragonborn':
    {
        'name': 'Brass Metallic Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Metallic Ancestry'
            },
            {
                'name': 'Breath Weapon (Fire)',
                'description': 'Breath Weapon (Metallic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Metallic Dragonborn)'
            },
            {
                'name': 'Metallic Breath Weapon',
                'description': 'Metallic Breath Weapon',
                'level': 5
            }
        ],
        'dr': [
            'fire'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'bronze-metallic-dragonborn':
    {
        'name': 'Bronze Metallic Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Metallic Ancestry'
            },
            {
                'name': 'Breath Weapon (Lightning)',
                'description': 'Breath Weapon (Metallic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Metallic Dragonborn)'
            },
            {
                'name': 'Metallic Breath Weapon',
                'description': 'Metallic Breath Weapon',
                'level': 5
            }
        ],
        'dr': [
            'lightning'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'copper-metallic-dragonborn':
    {
        'name': 'Copper Metallic Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Metallic Ancestry'
            },
            {
                'name': 'Breath Weapon (Acid)',
                'description': 'Breath Weapon (Metallic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Metallic Dragonborn)'
            },
            {
                'name': 'Metallic Breath Weapon',
                'description': 'Metallic Breath Weapon',
                'level': 5
            }
        ],
        'dr': [
            'acid'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'gold-metallic-dragonborn':
    {
        'name': 'Gold Metallic Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Metallic Ancestry'
            },
            {
                'name': 'Breath Weapon (Fire)',
                'description': 'Breath Weapon (Metallic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Metallic Dragonborn)'
            },
            {
                'name': 'Metallic Breath Weapon',
                'description': 'Metallic Breath Weapon',
                'level': 5
            }
        ],
        'dr': [
            'fire'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'silver-metallic-dragonborn':
    {
        'name': 'Silver Metallic Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Metallic Ancestry'
            },
            {
                'name': 'Breath Weapon (Cold)',
                'description': 'Breath Weapon (Metallic Dragonborn)',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Draconic Resistance (Metallic Dragonborn)'
            },
            {
                'name': 'Metallic Breath Weapon',
                'description': 'Metallic Breath Weapon',
                'level': 5
            }
        ],
        'dr': [
            'cold'
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'black-ravenite-dragonborn':
    {
        'name': 'Black Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Black)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'blue-ravenite-dragonborn':
    {
        'name': 'Blue Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Blue)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'brass-ravenite-dragonborn':
    {
        'name': 'Brass Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Brass)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'bronze-ravenite-dragonborn':
    {
        'name': 'Bronze Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Bronze)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'copper-ravenite-dragonborn':
    {
        'name': 'Copper Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Copper)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'gold-ravenite-dragonborn':
    {
        'name': 'Gold Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Gold)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'green-ravenite-dragonborn':
    {
        'name': 'Green Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Green)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'red-ravenite-dragonborn':
    {
        'name': 'Red Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Red)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'silver-ravenite-dragonborn':
    {
        'name': 'Silver Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (Silver)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'white-ravenite-dragonborn':
    {
        'name': 'White Ravenite Dragonborn',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Breath Weapon (White)',
                'description': 'Breath Weapon (Dragonborn)'
            },
            {
                'name': 'Vengeful Assault'
            }
        ],
        'languages': [
            'draconic'
        ],
        'abilities': {
            'str': 2,
            'cha': 1
        }
    },
    'duergar':
    {
        'name': 'Duergar',
        'weight': 50,
        'enabled': true
    },
    'hill-dwarf':
    {
        'name': 'Hill Dwarf',
        'weight': 50,
        'enabled': true,
        'features': [
            {
                'name': 'Dwarven Resilience',
                'description': 'Dwarven Resilience'
            },
            {
                'name': 'Dwarven Combat Training'
            },
            {
                'name': 'Stonecunning',
                'description': 'Stonecunning'
            },
            {
                'name': 'Dwarven Toughness'
            },
            {
                'name': 'Tool Proficiency'
            }
        ],
        'languages': [
            'dwarvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'special': function(actor, updates) {
            let bonusHP = Math.ceil(chris.levelOrCR(actor));
            let currentHP = updates.actor?.system?.attributes?.hp?.value ?? actor.system.attributes.hp.max;
            setProperty(updates, 'actor.system.attributes.hp.max', currentHP + bonusHP);
            setProperty(updates, 'actor.system.attributes.hp.value', currentHP + bonusHP);
            let weaponProf = updates.actor?.system?.traits?.weaponProf?.value ?? actor.system.traits?.weaponProf?.value ? Array.from(actor.system.traits.weaponProf.value) : [];
            if (!weaponProf.includes('battleaxe')) weaponProf.push('battleaxe');
            if (!weaponProf.includes('handaxe')) weaponProf.push('handaxe');
            if (!weaponProf.includes('lighthammer')) weaponProf.push('lighthammer');
            if (!weaponProf.includes('warhammer')) weaponProf.push('warhammer');
            setProperty(updates, 'actor.system.traits.weaponProf.value', weaponProf);
        },
        'abilities': {
            'con': 2,
            'wis': 1
        },
        'extraTools': {
            'proficient': {
                'name': 'choose',
                'options': [
                    'smith',
                    'brewer',
                    'mason'
                ],
                'count': 1
            }
        }
    },
    'mountain-dwarf':
    {
        'name': 'Mountain Dwarf',
        'weight': 50,
        'enabled': false,
        'features': [
            {
                'name': 'Dwarven Resilience',
                'description': 'Dwarven Resilience'
            },
            {
                'name': 'Dwarven Combat Training'
            },
            {
                'name': 'Stonecunning',
                'description': 'Stonecunning'
            },
            {
                'name': 'Dwarven Armor Training'
            },
            {
                'name': 'Tool Proficiency'
            }
        ],
        'languages': [
            'dwarvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'special': function(actor, updates) {
            let weaponProf = updates.actor?.system?.traits?.weaponProf?.value ?? actor.system.traits?.weaponProf?.value ? Array.from(actor.system.traits.weaponProf.value) : [];
            if (!weaponProf.includes('battleaxe')) weaponProf.push('battleaxe');
            if (!weaponProf.includes('handaxe')) weaponProf.push('handaxe');
            if (!weaponProf.includes('lighthammer')) weaponProf.push('lighthammer');
            if (!weaponProf.includes('warhammer')) weaponProf.push('warhammer');
            setProperty(updates, 'actor.system.traits.weaponProf.value', weaponProf);
            let armorProf = updates.actor?.system?.traits?.armorProf?.value ?? actor.system.traits?.armorProf?.value ? Array.from(actor.system.traits.armorProf.value) : [];
            if (!armorProf.includes('lgt')) armorProf.push('lgt');
            if (!armorProf.includes('med')) armorProf.push('med');
            setProperty(updates, 'actor.system.traits.armorProf.value', armorProf);
        },
        'abilities': {
            'con': 2,
            'str': 2
        },
        'extraTools': {
            'proficient': {
                'name': 'choose',
                'options': [
                    'smith',
                    'brewer',
                    'mason'
                ],
                'count': 1
            }
        }
    },
    'mark-of-warding-dwarf':
    {
        'name': 'Mark of Warding Dwarf',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Dwarven Resilience',
                'description': 'Dwarven Resilience'
            },
            {
                'name': 'Dwarven Combat Training'
            },
            {
                'name': 'Stonecunning',
                'description': 'Stonecunning'
            },
            {
                'name': 'Warder\'s Intuition',
                'description': 'Warder\'s Intuition'
            },
            {
                'name': 'Wards and Seals',
                'description': 'Wards and Seals',
                'spellcasting': true
            },
            {
                'name': 'Spells of the Mark',
                'description': 'Spells of the Mark (Mark of Warding Dwarf)',
                'spellcasting': true
            },
            {
                'name': 'Tool Proficiency'
            }
        ],
        'spells': [
            {
                'name': 'Alarm',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'ability': 'int'
            },
            {
                'name': 'Mage Armor',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'ability': 'int'
            },
            {
                'name': 'Arcane Lock',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'level': 3,
                'ability': 'int'
            },
            {
                'name': 'Alarm',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 1
            },
            {
                'name': 'Armor of Agathys',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 1
            },
            {
                'name': 'Arcane Lock',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 3
            },
            {
                'name': 'Knock',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 3
            },
            {
                'name': 'Glyph of Warding',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Magic Circle',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Leomund\'s Secret Chest',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 7
            },
            {
                'name': 'Mordenkainen\'s Faithful Hound',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 7
            },
            {
                'name': 'Antilife Shell',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 9
            }
        ],
        'languages': [
            'dwarvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'con': 2,
            'int': 1
        },
        'extraTools': {
            'proficient': {
                'name': 'choose',
                'options': [
                    'smith',
                    'brewer',
                    'mason'
                ],
                'count': 1
            }
        }
    },
    'earth-genasi':
    {
        'name': 'Earth Genasi',
        'weight': 25,
        'enabled': true,
        'features': [
            {
                'name': 'Earth Walk',
                'description': 'Earth Walk'
            },
            {
                'name': 'Merge with Stone',
                'description': 'Merge with Stone',
                'spellcasting': true
            }
        ],
        'spells': [
            {
                'name': 'Blade Ward',
                'activation': {
                    'condition': '',
                    'cost': 1,
                    'type': 'bonus'
                },
                'uses': {
                    'max': '@prof',
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            },
            {
                'name': 'Blade Ward',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            },
            {
                'name': 'Pass without Trace',
                'uses': {
                    'max': 1,
                    'per': 'day',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Pass without Trace',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            }
        ],
        'languages': [
            'primordial',
            'terran'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'con': 2,
            'str': 1
        }
    },
    'autumn-eladrin':
    {
        'name': 'Autumn Eladrin',
        'weight': 10,
        'enabled': true,
        'monster': 'Autumn Eladrin',
        'special': function (actor, updates) {
            let level = chris.levelOrCR(actor);
            let bonusDamageDice = Math.max(Math.ceil(level / 2), 1);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[psychic]', 'psychic']]);
            setProperty(updates, 'embedded.Item.Longbow.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[psychic]', 'psychic']]);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.versatile', '1d10[slashing] + @mod ' + bonusDamageDice + 'd8[psychic]', 'psychic');
            let averageDamage = bonusDamageDice * 4;
            let descriptionLongsword = getProperty(updates, 'embedded.Item.Longsword.system.description.value')?.replace('22 (5d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            let descriptionLongbow = getProperty(updates, 'embedded.Item.Longbow.system.description.value')?.replace('22 (5d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            setProperty(updates, 'embedded.Item.Longsword.system.description.value', descriptionLongsword);
            setProperty(updates, 'embedded.Item.Longbow.system.description.value', descriptionLongbow);
        }
    },
    'winter-eladrin':
    {
        'name': 'Winter Eladrin',
        'weight': 10,
        'enabled': true,
        'monster': 'Winter Eladrin',
        'special': function (actor, updates) {
            let level = chris.levelOrCR(actor);
            let bonusDamageDice = Math.max(Math.floor(level /3), 1);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[cold]', 'cold']]);
            setProperty(updates, 'embedded.Item.Longbow.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[cold]', 'cold']]);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.versatile', '1d10[slashing] + @mod ' + bonusDamageDice + 'd8[cold]', 'cold');
            let averageDamage = bonusDamageDice * 4;
            let descriptionLongsword = getProperty(updates, 'embedded.Item.Longsword.system.description.value')?.replace('13 (3d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            let descriptionLongbow = getProperty(updates, 'embedded.Item.Longbow.system.description.value')?.replace('13 (3d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            setProperty(updates, 'embedded.Item.Longsword.system.description.value', descriptionLongsword);
            setProperty(updates, 'embedded.Item.Longbow.system.description.value', descriptionLongbow);
        }
    },
    'spring-eladrin':
    {
        'name': 'Spring Eladrin',
        'weight': 10,
        'enabled': true,
        'monster': 'Spring Eladrin',
        'special': function (actor, updates) {
            let level = chris.levelOrCR(actor);
            let bonusDamageDice = Math.max(Math.ceil(level / 2), 1);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[psychic]', 'psychic']]);
            setProperty(updates, 'embedded.Item.Longbow.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[psychic]', 'psychic']]);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.versatile', '1d10[slashing] + @mod ' + bonusDamageDice + 'd8[psychic]', 'psychic');
            let averageDamage = bonusDamageDice * 4;
            let descriptionLongsword = getProperty(updates, 'embedded.Item.Longsword.system.description.value')?.replace('22 (5d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            let descriptionLongbow = getProperty(updates, 'embedded.Item.Longbow.system.description.value')?.replace('22 (5d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            setProperty(updates, 'embedded.Item.Longsword.system.description.value', descriptionLongsword);
            setProperty(updates, 'embedded.Item.Longbow.system.description.value', descriptionLongbow);
        }
    },
    'summer-eladrin':
    {
        'name': 'Summer Eladrin',
        'weight': 10,
        'enabled': true,
        'monster': 'Summer Eladrin',
        'special': function (actor, updates) {
            let level = chris.levelOrCR(actor);
            let bonusDamageDice = Math.max(Math.floor(level /5), 1);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[fire]', 'fire']]);
            setProperty(updates, 'embedded.Item.Longbow.system.damage.parts', [['1d8[slashing] + @mod', 'slashing'], [bonusDamageDice + 'd8[fire]', 'fire']]);
            setProperty(updates, 'embedded.Item.Longsword.system.damage.versatile', '1d10[slashing] + @mod ' + bonusDamageDice + 'd8[fire]', 'fire');
            let averageDamage = bonusDamageDice * 4;
            let descriptionLongsword = getProperty(updates, 'embedded.Item.Longsword.system.description.value')?.replace('9 (2d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            let descriptionLongbow = getProperty(updates, 'embedded.Item.Longbow.system.description.value')?.replace('9 (2d8)', averageDamage + ' (' + bonusDamageDice + 'd8)');
            setProperty(updates, 'embedded.Item.Longsword.system.description.value', descriptionLongsword);
            setProperty(updates, 'embedded.Item.Longbow.system.description.value', descriptionLongbow);
        }
    },
    'aereni-high-elf':
    {
        'name': 'Aereni High Elf',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Aereni High Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Aereni Elf'
            },
            {
                'name': 'Cantrip (Aereni High Elf)',
                'rename': 'Cantrip',
                'spellcasting': true
            }
        ],
        'spellcasting': {
            'wizard': {
                'cantrip': 1
            }
        },
        'extraSkills': {
            'expertise': {
                'name': 'any',
                'count': 1
            }
        },
        'languages': [
            'elvish'
        ],
        'extraLanguages': [
            {
                'name': 'any',
                'count': 1
            }
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'dex': 2,
            'int': 1
        },
        'skills': {
            'prc': 1
        }
    },
    'aereni-wood-elf':
    {
        'name': 'Aereni Wood Elf',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Aereni Wood Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Aereni Elf'
            },
            {
                'name': 'Fleet of Foot'
            },
            {
                'name': 'Mask of the Wild'
            }
        ],
        'languages': [
            'elvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'extraSkills': {
            'expertise': {
                'name': 'any',
                'count': 1
            }
        },
        'movement': {
            'walk': 35
        },
        'skills': {
            'prc': 1
        },
        'abilities': {
            'dex': 2,
            'wis': 1
        },
        'skills': {
            'per': 1
        }
    },
    'drow':
    {
        'name': 'Drow',
        'weight': 25,
        'enabled': true,
        'monster': 'Drow'
    },
    'high-elf':
    {
        'name': 'High Elf',
        'weight': 50,
        'enabled': true,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (High Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Elf Weapon Training'
            },
            {
                'name': 'Cantrip (High Elf)',
                'rename': 'Cantrip',
                'spellcasting': true
            }
        ],
        'spellcasting': {
            'wizard': {
                'cantrip': 1
            }
        },
        'languages': [
            'elvish'
        ],
        'extraLanguages': [
            {
                'name': 'any',
                'count': 1
            }
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'dex': 2,
            'int': 1
        },
        'special': function(actor, updates) {
            let weaponProf = updates.actor?.system?.traits?.weaponProf?.value ?? actor.system.traits?.weaponProf?.value ? Array.from(actor.system.traits.weaponProf.value) : [];
            if (!weaponProf.includes('longsword')) weaponProf.push('longsword');
            if (!weaponProf.includes('shortsword')) weaponProf.push('shortsword');
            if (!weaponProf.includes('shortbow')) weaponProf.push('shortbow');
            if (!weaponProf.includes('longbow')) weaponProf.push('longbow');
            setProperty(updates, 'actor.system.traits.weaponProf.value', weaponProf);
        },
        'skills': {
            'prc': 1
        }
    },
    'mark-of-shadow-elf':
    {
        'name': 'Mark of Shadow Elf',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Mark of Shadow Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Cunning Intuition',
                'description': 'Cunning Intuition'
            },
            {
                'name': 'Shape Shadows',
                'spellcasting': true
            },
            {
                'name': 'Spells of the Mark',
                'description': 'Spells of the Mark (Mark of Shadow Elf)',
                'spellcasting': true
            }
        ],
        'spells': [
            {
                'name': 'Minor Illusion'
            },
            {
                'name': 'Invisibility',
                'level': 3,
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'ability': 'cha'
            },
            {
                'name': 'Disguise Self',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 1
            },
            {
                'name': 'Silent Image',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 1
            },
            {
                'name': 'Darkness',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 3
            },
            {
                'name': 'Pass without Trace',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 3
            },
            {
                'name': 'Clairvoyance',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Major Image',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Greater Invisibility',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 7
            },
            {
                'name': 'Hallucinatory Terrain',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 7
            },
            {
                'name': 'Mislead',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 9
            }
        ],
        'languages': [
            'elvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'dex': 2,
            'cha': 1
        },
        'skills': {
            'prc': 1
        }
    },
    'pallid-elf':
    {
        'name': 'Pallid Elf',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Pallid Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Incisive Sense',
                'description': 'Incisive Sense'
            },
            {
                'name': 'Blessing of the Moon Weaver',
                'spellcasting': true
            }
        ],
        'spells': [
            {
                'name': 'Light',
                'ability': 'wis'
            },
            {
                'name': 'Sleep',
                'level': 3,
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'ability': 'wis'
            },
            {
                'name': 'Invisibility',
                'level': 5,
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'target': {
                    'type': 'self',
                    'units': null,
                    'value': null,
                    'width': null
                },
                'range': {
                    'long': null,
                    'units': 'self',
                    'value': null
                },
                'ability': 'wis'
            }
        ],
        'languages': [
            'elvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'dex': 2,
            'wis': 1
        },
        'skills': {
            'prc': 1
        }
    },
    'valenar-high-elf':
    {
        'name': 'Valenar High Elf',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Valenar High Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Valenar Elf'
            },
            {
                'name': 'Cantrip (High Elf)',
                'rename': 'Cantrip',
                'spellcasting': true
            }
        ],
        'spellcasting': {
            'wizard': {
                'cantrip': 1
            }
        },
        'languages': [
            'elvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'dex': 2,
            'int': 1
        },
        'special': function(actor, updates) {
            let weaponProf = updates.actor?.system?.traits?.weaponProf?.value ?? actor.system.traits?.weaponProf?.value ? Array.from(actor.system.traits.weaponProf.value) : [];
            if (!weaponProf.includes('scimitar')) weaponProf.push('scimitar');
            if (!weaponProf.includes('longbow')) weaponProf.push('longbow');
            if (!weaponProf.includes('shortbow')) weaponProf.push('shortbow');
            setProperty(updates, 'actor.system.traits.weaponProf.value', weaponProf);
        },
        'skills': {
            'prc': 1
        }
    },
    'valenar-wood-elf':
    {
        'name': 'Valenar Wood Elf',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Valenar Wood Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Valenar Elf'
            },
            {
                'name': 'Fleet of Foot'
            },
            {
                'name': 'Mask of the Wild'
            }
        ],
        'languages': [
            'elvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'extraSkills': {
            'expertise': {
                'name': 'any',
                'count': 1
            }
        },
        'movement': {
            'walk': 35
        },
        'skills': {
            'prc': 1
        },
        'abilities': {
            'dex': 2,
            'wis': 1
        },
        'skills': {
            'per': 1
        },
        'special': function(actor, updates) {
            let weaponProf = updates.actor?.system?.traits?.weaponProf?.value ?? actor.system.traits?.weaponProf?.value ? Array.from(actor.system.traits.weaponProf.value) : [];
            if (!weaponProf.includes('scimitar')) weaponProf.push('scimitar');
            if (!weaponProf.includes('longbow')) weaponProf.push('longbow');
            if (!weaponProf.includes('shortbow')) weaponProf.push('shortbow');
            setProperty(updates, 'actor.system.traits.weaponProf.value', weaponProf);
        }
    },
    'wood-elf':
    {
        'name': 'Wood Elf',
        'weight': 50,
        'enabled': true,
        'features': [
            {
                'name': 'Keen Senses'
            },
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Wood Elf)'
            },
            {
                'name': 'Trance'
            },
            {
                'name': 'Elf Weapon Training'
            },
            {
                'name': 'Fleet of Foot'
            },
            {
                'name': 'Mask of the Wild'
            }
        ],
        'languages': [
            'elvish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'extraSkills': {
            'expertise': {
                'name': 'any',
                'count': 1
            }
        },
        'movement': {
            'walk': 35
        },
        'skills': {
            'prc': 1
        },
        'abilities': {
            'dex': 2,
            'wis': 1
        },
        'skills': {
            'per': 1
        },
        'special': function(actor, updates) {
            let weaponProf = updates.actor?.system?.traits?.weaponProf?.value ?? actor.system.traits?.weaponProf?.value ? Array.from(actor.system.traits.weaponProf.value) : [];
            if (!weaponProf.includes('longsword')) weaponProf.push('longsword');
            if (!weaponProf.includes('shortsword')) weaponProf.push('shortsword');
            if (!weaponProf.includes('shortbow')) weaponProf.push('shortbow');
            if (!weaponProf.includes('longbow')) weaponProf.push('longbow');
            setProperty(updates, 'actor.system.traits.weaponProf.value', weaponProf);
        }
    },
    'fairy':
    {
        'name': 'Fairy',
        'weight': 5,
        'enabled': true,
        'features': [
            {
                'name': 'Fairy Magic',
                'spellcasting': true
            },
            {
                'name': 'Flight (Fairy)'
            }
        ],
        'spells': [
            {
                'name': 'Faerie Fire',
                'level': 3,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Faerie Fire',
                'level': 3,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            },
            {
                'name': 'Enlarge/Reduce',
                'level': 5,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Enlarge/Reduce',
                'level': 5,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            }
        ],
        'size': 'small',
        'movement': {
            'fly': 30
        }
    },
    'firbolg':
    {
        'name': 'Firbolg',
        'weight': 25,
        'enabled': true,
        'features': [
            {
                'name': 'Firbolg Magic',
                'spellcasting': true
            },
            {
                'name': 'Hidden Step',
                'description': 'Hidden Step',
                'uses': {
                    'max': '@prof'
                }
            },
            {
                'name': 'Powerful Build'
            },
            {
                'name': 'Speech of Beast and Leaf'
            }
        ],
        'spells': [
            {
                'name': 'Detect Magic',
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Disguise Self',
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Detect Magic',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            },
            {
                'name': 'Disguise Self',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            }
        ],
        'languages': [
            'elvish',
            'giant'
        ],
        'abilities': {
            'wis': 2,
            'str': 1
        }
    },
    'fire-genasi':
    {
        'name': 'Fire Genasi',
        'weight': 25,
        'enabled': true,
        'features': [
            {
                'name': 'Fire Resistance'
            },
            {
                'name': 'Reach to the Blaze',
                'spellcasting': true
            }
        ],
        'spells': [
            {
                'name': 'Produce Flame'
            },
            {
                'name': 'Burning Hands',
                'level': 3,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Flame Blade',
                'level': 5,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Burning Hands',
                'level': 3,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            },
            {
                'name': 'Flame Blade',
                'level': 5,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            }
        ],
        'dr': [
            'fire'
        ],
        'languages': [
            'primordial',
            'ignan'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'abilities': {
            'con': 2,
            'int': 1
        }
    },
    'giff':
    {
        'name': 'Giff',
        'weight': 5,
        'enabled': false,
        'monster': 'Giff'
    },
    'githyanki':
    {
        'name': 'Githyanki',
        'weight': 10,
        'enabled': true,
        'features': [
            {
                'name': 'Astral Knowledge',
                'description': 'Astral Knowledge'
            },
            {
                'name': 'Githyanki Psionics',
                'spellcasting': true
            },
            {
                'name': 'Psychic Resilience'
            }
        ],
        'spells': [
            {
                'name': 'Mage Hand'
            },
            {
                'name': 'Jump',
                'level': 3,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Misty Step',
                'level': 5,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Jump',
                'level': 3,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            },
            {
                'name': 'Misty Step',
                'level': 5,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            }
        ],
        'dr': [
            'psychic'
        ],
        'languages': [
            'gith'
        ],
        'abilities': {
            'int': 1,
            'str': 2
        }
    },
    'githzerai':
    {
        'name': 'Githzerai',
        'weight': 10,
        'enabled': true,
        'features': [
            {
                'name': 'Mental Discipline (Githzerai)',
                'description': 'Mental Discipline (Githzerai)'
            },
            {
                'name': 'Githyanki Psionics',
                'spellcasting': true
            },
            {
                'name': 'Psychic Resilience'
            }
        ],
        'spells': [
            {
                'name': 'Mage Hand'
            },
            {
                'name': 'Shield',
                'level': 3,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Detect Thoughts',
                'level': 5,
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                },
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                }
            },
            {
                'name': 'Shield',
                'level': 3,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            },
            {
                'name': 'Detect Thoughts',
                'level': 5,
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                }
            }
        ],
        'dr': [
            'psychic'
        ],
        'languages': [
            'gith'
        ],
        'abilities': {
            'int': 1,
            'wis': 2
        }
    },
    'forest-gnome':
    {
        'name': 'Forest Gnome',
        'weight': 50,
        'enabled': true,
        'features': [
            {
                'name': 'Natural Illusionist',
                'spellcasting': true
            },
            {
                'name': 'Speak with Small Beasts'
            },
            {
                'name': 'Gnome Cunning',
                'description': 'Gnome Cunning'
            }
        ],
        'spells': [
            {
                'name': 'Minor Illusion',
                'ability': 'int'
            }
        ],
        'languages': [
            'gnomish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'movement': {
            'walk': 25
        },
        'size': 'small',
        'abilities': {
            'dex': 1,
            'int': 2
        }
    },
    'mark-of-scribing-gnome':
    {
        'name': 'Mark of Scribing Gnome',
        'weight': 25,
        'enabled': false,
        'features': [
            {
                'name': 'Gnome Cunning',
                'description': 'Gnome Cunning'
            },
            {
                'name': 'Gifted Scribe',
                'description': 'Gifted Scribe'
            },
            {
                'name': 'Scribe\'s Insight'
            },
            {
                'name': 'Spells of the Mark',
                'description': 'Spells of the Mark (Mark of Scribing Gnome)',
                'spellcasting': true
            }
        ],
        'spells': [
            {
                'name': 'Message',
                'ability': 'int'
            },
            {
                'name': 'Comprehend Languages',
                'ability': 'int',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            },
            {
                'name': 'Magic Mouth',
                'level': 3,
                'ability': 'int',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            },
            {
                'name': 'Comprehend Languages',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 1
            },
            {
                'name': 'Illusory Script',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 1
            },
            {
                'name': 'Animal Messenger',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 3
            },
            {
                'name': 'Silence',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 3
            },
            {
                'name': 'Sending',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Tongues',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 5
            },
            {
                'name': 'Arcane Eye',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 7
            },
            {
                'name': 'Confusion',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 7
            },
            {
                'name': 'Dream',
                'preparation': {
                    'mode': 'prepared',
                    'prepared': true
                },
                'level': 9
            }
        ],
        'languages': [
            'gnomish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'movement': {
            'walk': 25
        },
        'size': 'small',
        'abilities': {
            'cha': 1,
            'int': 2
        }
    },
    'rock-gnome':
    {
        'name': 'Rock Gnome',
        'weight': 50,
        'enabled': true,
        'features': [
            {
                'name': 'Artificer\'s Lore'
            },
            {
                'name': 'Tinker'
            },
            {
                'name': 'Gnome Cunning',
                'description': 'Gnome Cunning'
            }
        ],
        'languages': [
            'gnomish'
        ],
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'movement': {
            'walk': 25
        },
        'size': 'small',
        'abilities': {
            'con': 1,
            'int': 2
        }
    },
    'goblin':
    {
        'name': 'Goblin',
        'weight': 5,
        'enabled': true,
        'monster': 'Goblin'
    },
    'goliath':
    {
        'name': 'Goliath',
        'weight': 10,
        'enabled': true,
        'features': [
            {
                'name': 'Little Giant'
            },
            {
                'name': 'Mountain Born'
            },
            {
                'name': 'Stone\'s Endurance',
                'description': 'Stone\'s Endurance',
                'uses': {
                    'max': '@prof'
                }
            }
        ],
        'languages': [
            'giant'
        ],
        'abilities': {
            'str': 2,
            'con': 1
        },
        'dr': [
            'cold'
        ],
        'specialTraits': {
            'powerfulBuild': true
        },
        'skills': {
            'ath': 1
        }
    },
    'grung':
    {
        'name': 'Grung',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Arboreal Alertness'
            },
            {
                'name': 'Amphibious',
                'description': 'Amphibious (Grung)'
            },
            {
                'name': 'Poison Immunity'
            },
            {
                'name': 'Poisonous Skin',
                'description': 'Poisonous Skin'
            },
            {
                'name': 'Grung Poison',
                'description': 'Grung Poison'
            },
            {
                'name': 'Standing Leap'
            },
            {
                'name': 'Water Dependency'
            }
        ],
        'di': [
            'poison'
        ],
        'ci': [
            'poisoned'
        ],
        'special': async function (actor, updates) {
            let customLanguages = actor.system.traits.languages.custom;
            let addedLanguages = customLanguages === '' ? 'Grung' : ' ;Grung';
            setProperty(updates, 'actor.system.traits.languages.custom', customLanguages + addedLanguages);
        },
        'abilities': {
            'dex': 2,
            'con': 1
        },
        'skills': {
            'prc': 1
        }
    },
    'hadozee':
    {
        'name': 'Hadozee',
        'weight': 5,
        'enabled': false,
        'features': [
            {
                'name': 'Dexterous Feet'
            },
            {
                'name': 'Glide'
            },
            {
                'name': 'Hadozee Dodge',
                'description': 'Hadozee Dodge',
                'uses': {
                    'max': '@prof'
                }
            }
        ]
    },
    'aquatic-half-elf':
    {
        'name': 'Aquatic Half-Elf',
        'weight': 5,
        'enabled': true,
        'features': [
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Aquatic Half-Elf)'
            },
            {
                'name': 'Aquatic Heritage'
            }
        ],
        'languages': [
            'common',
            'elvish',
            'primordial'
        ],
        'abilities': {
            'cha': 2
        },
        'unassignedAbilities': {
            'one': 2
        },
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        },
        'movement': {
            'swim': 30
        }
    },
    'drow-half-elf':
    {
        'name': 'Drow Half-Elf',
        'weight': 10,
        'enabled': true,
        'features': [
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (Drow Half-Elf)'
            },
            {
                'name': 'Drow Magic',
                'spellcasting': true
            }
        ],
        'spells': [
            {
                'name': 'Dancing Lights'
            },
            {
                'name': 'Faerie Fire',
                'level': 3,
                'ability': 'cha',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            },
            {
                'name': 'Darkness',
                'level': 5,
                'ability': 'cha',
                'uses': {
                    'max': 1,
                    'per': 'lr',
                    'recovery': '',
                    'value': 1
                },
                'preparation': {
                    'mode': 'innate',
                    'prepared': true
                }
            }
        ],
        'languages': [
            'common',
            'elvish',
            'undercommon'
        ],
        'abilities': {
            'cha': 2
        },
        'unassignedAbilities': {
            'one': 2
        },
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        }
    },
    'high-half-elf':
    {
        'name': 'High Half-Elf',
        'weight': 50,
        'enabled': true,
        'features': [
            {
                'name': 'Fey Ancestry',
                'description': 'Fey Ancestry (High Half-Elf)'
            },
            {
                'name': 'High Elf Descent',
                'spellcasting': true
            }
        ],
        'spellcasting': {
            'wizard': {
                'cantrip': 1
            }
        },
        'extraLanguages': [
            {
                'name': 'any',
                'count': 1
            }
        ],
        'languages': [
            'common',
            'elvish'
        ],
        'abilities': {
            'cha': 2
        },
        'unassignedAbilities': {
            'one': 2
        },
        'senses': {
            'darkvision': 60
        },
        'sight': {
            'range': 60,
            'visionMode': 'darkvision'
        }
    },
    'mark-of-detection-half-elf':
    {
        'name': 'Mark of Detection Half-Elf',
        'weight': 25,
        'enabled': false
    },
    'mark-of-storm-half-elf':
    {
        'name': 'Mark of Storm Half-Elf',
        'weight': 25,
        'enabled': false
    },
    'wood-half-elf':
    {
        'name': 'Wood Half-Elf',
        'weight': 50,
        'enabled': true
    },
    'half-orc':
    {
        'name': 'Half-Orc',
        'weight': 10,
        'enabled': true
    },
    'mark-of-finding-half-orc':
    {
        'name': 'Mark of Finding Half-Orc',
        'weight': 25,
        'enabled': false
    },
    'ghostwise-halfling':
    {
        'name': 'Ghostwise Halfling',
        'weight': 10,
        'enabled': false
    },
    'lightfoot-halfling':
    {
        'name': 'Lightfoot Halfling',
        'weight': 50,
        'enabled': true
    },
    'lotusden-halfling':
    {
        'name': 'Lotusden Halfling',
        'weight': 25,
        'enabled': false
    },
    'mark-of-healing-halfling':
    {
        'name': 'Mark of Healing Halfling',
        'weight': 25,
        'enabled': false
    },
    'mark-of-hospitality-halfling':
    {
        'name': 'Mark of Hospitality Halfling',
        'weight': 25,
        'enabled': false
    },
    'stout-halfling':
    {
        'name': 'Stout Halfling',
        'weight': 50,
        'enabled': true
    },
    'harengon':
    {
        'name': 'Harengon',
        'weight': 10,
        'enabled': false
    },
    'hexblood':
    {
        'name': 'Hexblood',
        'weight': 5,
        'enabled': false
    },
    'hobgoblin':
    {
        'name': 'Hobgoblin',
        'weight': 10,
        'enabled': true
    },
    'human':
    {
        'name': 'Human',
        'weight': 100,
        'enabled': true
    },
    'mark-of-finding-human':
    {
        'name': 'Mark of Finding Human',
        'weight': 25,
        'enabled': false
    },
    'mark-of-handling-human':
    {
        'name': 'Mark of Handling Human',
        'weight': 25,
        'enabled': false
    },
    'mark-of-making-human':
    {
        'name': 'Mark of Making Human',
        'weight': 25,
        'enabled': false
    },
    'mark-of-passage-human':
    {
        'name': 'Mark of Passage Human',
        'weight': 25,
        'enabled': false
    },
    'kalashtar':
    {
        'name': 'Kalashtar',
        'weight': 25,
        'enabled': false
    },
    'kender':
    {
        'name': 'Kender',
        'weight': 25,
        'enabled': false
    },
    'kenku':
    {
        'name': 'Kenku',
        'weight': 5,
        'enabled': true
    },
    'kobold':
    {
        'name': 'Kobold',
        'weight': 5,
        'enabled': true
    },
    'leonin':
    {
        'name': 'Leonin',
        'weight': 10,
        'enabled': false
    },
    'lizardfolk':
    {
        'name': 'Lizardfolk',
        'weight': 5,
        'enabled': true
    },
    'locathah':
    {
        'name': 'Locathah',
        'weight': 5,
        'enabled': false
    },
    'loxodon':
    {
        'name': 'Loxodon',
        'weight': 25,
        'enabled': false
    },
    'minotaur':
    {
        'name': 'Minotaur',
        'weight': 5,
        'enabled': true
    },
    'orc':
    {
        'name': 'Orc',
        'weight': 5,
        'enabled': true
    },
    'owlin':
    {
        'name': 'Owlin',
        'weight': 10,
        'enabled': false
    },
    'plasmoid':
    {
        'name': 'Plasmoid',
        'weight': 5,
        'enabled': false
    },
    'reborn':
    {
        'name': 'Reborn',
        'weight': 5,
        'enabled': false
    },
    'satyr':
    {
        'name': 'Satyr',
        'weight': 5,
        'enabled': true
    },
    'sea-elf':
    {
        'name': 'Sea Elf',
        'weight': 10,
        'enabled': true
    },
    'shadar-kai':
    {
        'name': 'Shadar-Kai',
        'weight': 5,
        'enabled': true
    },
    'beasthide-shifter':
    {
        'name': 'Beasthide Shifter',
        'weight': 5,
        'enabled': true
    },
    'longtooth-shifter':
    {
        'name': 'Longtooth Shifter',
        'weight': 5,
        'enabled': true
    },
    'swiftstride-shifter':
    {
        'name': 'Swiftstride Shifter',
        'weight': 5,
        'enabled': true
    },
    'wildhunt-shifter':
    {
        'name': 'Wildhunt Shifter',
        'weight': 5,
        'enabled': true
    },
    'simic-hybrid':
    {
        'name': 'Simic Hybrid',
        'weight': 25,
        'enabled': false
    },
    'tabaxi':
    {
        'name': 'Tabaxi',
        'weight': 10,
        'enabled': true
    },
    'thri-kreen':
    {
        'name': 'Thri-Kreen',
        'weight': 5,
        'enabled': false
    },
    'baalzebul-tiefling':
    {
        'name': 'Baalzebul Tiefling',
        'weight': 1,
        'enabled': true
    },
    'dispater-tiefling':
    {
        'name': 'Dispater Tiefling',
        'weight': 1,
        'enabled': true
    },
    'tierna-tiefling':
    {
        'name': 'Tierna Tiefling',
        'weight': 1,
        'enabled': true
    },
    'glasya-tiefling':
    {
        'name': 'Glasya Tiefling',
        'weight': 1,
        'enabled': true
    },
    'levistus-tiefling':
    {
        'name': 'Levistus Tiefling',
        'weight': 1,
        'enabled': true
    },
    'mammon-tiefling':
    {
        'name': 'Mammon Tiefling',
        'weight': 1,
        'enabled': true
    },
    'mephistopheles-tiefling':
    {
        'name': 'Mephistopheles Tiefling',
        'weight': 1,
        'enabled': true
    },
    'zariel-tiefling':
    {
        'name': 'Zariel Tiefling',
        'weight': 1,
        'enabled': true
    },
    'hellfire-tiefling':
    {
        'name': 'Hellfire Tiefling',
        'weight': 1,
        'enabled': true
    },
    'winged-tiefling':
    {
        'name': 'Winged Tiefling',
        'weight': 1,
        'enabled': true
    },
    'feral-winged-tiefling':
    {
        'name': 'Feral Winged Tiefling',
        'weight': 1,
        'enabled': false
    },
    'feral-hellfire-tiefling':
    {
        'name': 'Feral Hellfire Tiefling',
        'weight': 1,
        'enabled': false
    },
    'tortle':
    {
        'name': 'Tortle',
        'weight': 5,
        'enabled': true
    },
    'triton':
    {
        'name': 'Triton',
        'weight': 5,
        'enabled': true
    },
    'vedalken':
    {
        'name': 'Vedalken',
        'weight': 25,
        'enabled': false
    },
    'verdan':
    {
        'name': 'Verdan',
        'weight': 5,
        'enabled': false
    },
    'water-genasi':
    {
        'name': 'Water Genasi',
        'weight': 25,
        'enabled': false
    },
    'warforged':
    {
        'name': 'Warforged',
        'weight': 25,
        'enabled': false
    },
    'yaun-ti':
    {
        'name': 'Yaun-Ti',
        'weight': 5,
        'enabled': true
    }
};
let chanceTable = [];
let chanceTotal;
export function updateChanceTable () {
    chanceTotal = 0;
    for (let [key, value] of Object.entries(game.settings.get('chris-premades', 'Humanoid Randomizer Settings'))) {
        if (!value.enabled) continue;
        chanceTable.push([key, value.weight]);
        chanceTotal += value.weight;
    }
}
function pickRace() {
    if (chanceTable.length === 0) updateChanceTable();
    let threshold = Math.random() * chanceTotal;
    let total = 0;
    for (let i = 0; i < chanceTotal - 1; ++i) {
        total += chanceTable[i][1];
        if (total >= threshold) {
            return chanceTable[i][0];
        }
    }
    return chanceTable[chanceTotal - 1][0];
}
export async function npcRandomizer(token, options, user) {
    if ((game.user.id !== user) || token.actorLink) return;
    let item = token.actor.items.getName('CPR - Randomizer');
    if (!item) return;
    let actor = token.actor;
    let updates = {};
    if (chris.getConfiguration(item, 'humanoid')) await humanoid(actor, updates, item) ?? false;
    setProperty(updates, 'embedded.Item.CPR - Randomizer', warpgate.CONST.DELETE);
    console.log(updates);
    let warpgateOptions = {
        'permanent': true,
        'name': 'CPR - Randomzier',
        'description': 'CPR - Randomzier'
    };
    await warpgate.mutate(token, updates, {}, warpgateOptions);
}
async function humanoid(targetActor, updates, item) {
//    let race = pickRace();
    let race = 'high-half-elf';
    console.log(race);
    let sourceActor;
    if (allRaces[race].monster) {
        sourceActor = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Monster Compendium'), allRaces[race].monster, true);
        if (!sourceActor) return;
    }
    let skills = chris.getConfiguration(item, 'skills') ?? 'upgrade';
    let abilities = chris.getConfiguration(item, 'abilities') ?? 'upgrade';
    if (sourceActor) {
        for (let i of Object.keys(CONFIG.DND5E.abilities)) {
            let sourceAbility = sourceActor.system.abilities[i].value;
            let targetAbility = targetActor.system.abilities[i].value;
            switch (abilities) {
                case 'source':
                    setProperty(updates, 'actor.system.abilities.' + i + '.value', sourceAbility);
                    break;
                case 'upgrade':
                    if (sourceAbility > targetAbility) setProperty(updates, 'actor.system.abilities.' + i + '.value', sourceAbility);
                    break;
                case 'downgrade':
                    if (sourceAbility < targetAbility) setProperty(updates, 'actor.system.abilities.' + i + '.value', sourceAbility);
                    break;
            }
        }
        for (let i of Object.keys(CONFIG.DND5E.skills)) {
            let sourceSkill = sourceActor.system.skills[i].value;
            let targetSkill = targetActor.system.skills[i].value;
            switch (skills) {
                case 'source':
                    setProperty(updates, 'actor.system.skills.' + i + '.value', sourceSkill);
                    break;
                case 'upgrade':
                    if (sourceSkill > targetSkill) setProperty(updates, 'actor.system.skills.' + i + '.value', sourceSkill);
                    break;
                case 'downgrade':
                    if (sourceSkill < targetSkill) setProperty(updates, 'actor.system.skills.' + i + '.value', sourceSkill);
                    break;
            }
        }
        let avatar = chris.getConfiguration(item, 'avatar') ?? 'source';
        if (avatar === 'source') setProperty(updates, 'actor.img', sourceActor.img);
        let token = chris.getConfiguration(item, 'token') ?? 'source';
        if (token === 'source') {
            setProperty(updates, 'actor.prototypeToken.texture.src', sourceActor.prototypeToken.texture.src);
            setProperty(updates, 'token.texture.src', sourceActor.prototypeToken.texture.src);
        }
        setProperty(updates, 'actor.system.details.type.subtype', sourceActor.system.details.type.subtype);
    }
    let features = chris.getConfiguration(item, 'features') ?? 'merge';
    let spells = chris.getConfiguration(item, 'spells') ?? true;
    if (features === 'merge' && sourceActor) {
        for (let item of sourceActor.items) {
            if (updates.embedded?.Item?.[item.name]) continue;
            setProperty(updates, 'embedded.Item.' + item.name, item);
        }
    } else if (features === 'source' && sourceActor) {
        for (let item of targetActor.items) {
            setProperty(updates, 'embedded.Item.' + item.name, warpgate.CONST.DELETE)
        }
        for (let item of sourceActor.items) setProperty(updates, 'embedded.Item.' + item.name, item);
    } else if (features === 'merge' && !sourceActor && allRaces[race].features) {
        for (let i of allRaces[race].features) {
            if (i.spellcasting && !spells) continue;
            if (i.level) {
                if (i.level > chris.levelOrCR(targetActor)) continue;
            }
            let featureData = await chris.getItemFromCompendium('chris-premades.CPR Race Features', i.name, true);
            if (!featureData) featureData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Racial Trait Compendium'), i.name, true);
            if (!featureData) continue;
            if (i.description) {
                let descriptionItem = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Racial Trait Compendium'), i.description, true);
                if (descriptionItem) featureData.system.description.value = descriptionItem.system.description.value;
            }
            if (i.uses) {
                if (i.uses.max === '@prof') setProperty(featureData, 'system.uses.value', targetActor.system.attributes.prof);
            }
            if (!featureData.img) featureData.img = 'icons/sundries/gaming/dice-runed-brown.webp';
            if (i.rename) featureData.name = i.rename;
            setProperty(updates, 'embedded.Item.' + featureData.name, featureData);
        }
        if (allRaces[race].spells) {
            for (let i of allRaces[race].spells) {
                if (i.level) {
                    if (i.level > chris.levelOrCR(targetActor)) continue;
                }
                let spellData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Spell Compendium'), i.name, true);
                if (!spellData) continue;
                if (i.uses) {
                    setProperty(spellData, 'system.uses', i.uses);
                    if (spellData.system.uses.max === '@prof') setProperty(spellData, 'system.uses.value', targetActor.system.attributes.prof);
                }
                if (i.preparation) {
                    setProperty(spellData, 'system.preparation', i.preparation);
                    if (i.preparation.mode != 'prepared') spellData.name += ' (' + chris.titleCase(i.preparation.mode) + ')';
                } else {
                    setProperty(spellData, 'system.preparation.prepared', true);
                }
                if (i.ability) setProperty(spellData, 'system.ability', i.ability);
                setProperty(updates, 'embedded.Item.' + spellData.name, spellData);
                if (i.target) setProperty(spellData, 'system.target', i.target);
                if (i.range) setProperty(spellData, 'system.range', i.range);
            }
        }
        if (allRaces[race].skills) {
            switch (skills) {
                case 'upgrade':
                    for (let [key, value] of Object.entries(allRaces[race].skills)) {
                        if (targetActor.system.skills[key].value < value) setProperty(updates, 'actor.system.skills.' + key + '.value', value);
                    }
                    break;
                case 'downgrade':
                    for (let [key, value] of Object.entries(allRaces[race].skills)) {
                        if (targetActor.system.skills[key].value > value) setProperty(updates, 'actor.system.skills.' + key + '.value', value);
                    }
                    break;
            }
        }
        if (allRaces[race].abilities && abilities === 'upgrade') {
            for (let [key, value] of Object.entries(allRaces[race].abilities)) {
                let score = Math.min(20, targetActor.system.abilities[key].value + value);
                setProperty(updates, 'system.abilities.' + key + '.value', score);
            }
        }
    }
    let conditionImmunity = chris.getConfiguration(item, 'conditionimmunity') ?? 'merge';
    let damageImmunity = chris.getConfiguration(item, 'damageimmunity') ?? 'merge';
    let damageResistance = chris.getConfiguration(item, 'damageresistance') ?? 'merge';
    let damageVulnerability = chris.getConfiguration(item, 'damagevulnerability') ?? 'merge';
    let languages = chris.getConfiguration(item, 'languages') ?? 'merge';
    if (sourceActor) {
        if (conditionImmunity === 'source' || conditionImmunity === 'merge') setProperty(updates, 'actor.system.traits.ci.value', sourceActor.system.traits.ci.value);
        if (damageImmunity === 'source' || damageImmunity === 'merge') setProperty(updates, 'actor.system.traits.di.value', sourceActor.system.traits.di.value);
        if (damageResistance === 'source' || damageResistance === 'merge') setProperty(updates, 'actor.system.traits.dr.value', sourceActor.system.traits.dr.value);
        if (damageVulnerability === 'source' || damageVulnerability === 'merge') setProperty(updates, 'actor.system.traits.dv.value', sourceActor.system.traits.dv.value);
        if (languages === 'source' || languages === 'merge') setProperty(updates, 'actor.system.traits.languages.value', sourceActor.system.traits.languages.value);
    } else {
        if (allRaces[race].ci && (conditionImmunity === 'source' || conditionImmunity === 'merge')) setProperty(updates, 'actor.system.traits.ci.value', allRaces[race].ci);
        if (allRaces[race].di && (damageImmunity === 'source' || damageImmunity === 'merge')) setProperty(updates, 'actor.system.traits.di.value', allRaces[race].di);
        if (allRaces[race].dr && (damageResistance === 'source' || damageResistance === 'merge')) setProperty(updates, 'actor.system.traits.dr.value', allRaces[race].dr);
        if (allRaces[race].dv && (damageVulnerability === 'source' || damageVulnerability === 'merge')) setProperty(updates, 'actor.system.traits.dv.value', allRaces[race].dv);
        if (allRaces[race].languages && (languages === 'source' || languages === 'merge')) setProperty(updates, 'actor.system.traits.languages.value', allRaces[race].languages);
    }
    let name = chris.getConfiguration(item, 'name') ?? 'before';
    let sourceName = sourceActor?.name ?? allRaces[race].name;
    switch (name) {
        case 'source':
            setProperty(updates, 'actor.name', sourceName);
            setProperty(updates, 'token.name', sourceName);
            setProperty(updates, 'actor.prototypeToken.name', sourceName);
            break;
        case 'before':
            setProperty(updates, 'actor.name', sourceName + ' ' + targetActor.name);
            setProperty(updates, 'token.name', sourceName + ' ' + targetActor.name);
            setProperty(updates, 'actor.prototypeToken.name', sourceName + ' ' + targetActor.name);
            break;
        case 'after':
            setProperty(updates, 'actor.name', targetActor.name + ' ' + sourceName);
            setProperty(updates, 'token.name', targetActor.name + ' ' + sourceName);
            setProperty(updates, 'actor.prototypeToken.name', targetActor.name + ' ' + sourceName);
            break;
    }
    let ac = chris.getConfiguration(item, 'ac') ?? 'source';
    if (ac === 'source' && sourceActor) {
        setProperty(updates, 'actor.system.attributes.ac', sourceActor.system.attributes.ac);
    } else if (allRaces[race].ac && ac === 'source') {
        setProperty(updates, 'actor.system.attributes.ac.bonus',allRaces[race].ac);
    }
    let movement = chris.getConfiguration(item, 'movement') ?? 'source';
    switch (movement) {
        case 'source':
            if (sourceActor) {
                setProperty(updates, 'actor.system.attributes.movement', sourceActor.system.attributes.movement);
            } else if (allRaces[race].movement) {
                setProperty(updates, 'actor.system.attributes.movement', allRaces[race].movement);
            }
            break;
        case 'upgrade':
            if (sourceActor) {
                if (sourceActor.system.attributes.movement.burrow > targetActor.system.attributes.movement.burrow) setProperty(updates, 'actor.system.attributes.movement.burrow', sourceActor.system.attributes.movement.burrow);
                if (sourceActor.system.attributes.movement.climb > targetActor.system.attributes.movement.climb) setProperty(updates, 'actor.system.attributes.movement.climb', sourceActor.system.attributes.movement.climb);
                if (sourceActor.system.attributes.movement.fly > targetActor.system.attributes.movement.fly) setProperty(updates, 'actor.system.attributes.movement.fly', sourceActor.system.attributes.movement.fly);
                if (sourceActor.system.attributes.movement.swim > targetActor.system.attributes.movement.swim) setProperty(updates, 'actor.system.attributes.movement.swim', sourceActor.system.attributes.movement.swim);
                if (sourceActor.system.attributes.movement.walk > targetActor.system.attributes.movement.walk) setProperty(updates, 'actor.system.attributes.movement.walk', sourceActor.system.attributes.movement.walk);
                if (sourceActor.system.attributes.movement.hover) setProperty(updates, 'actor.system.attributes.movement.hover', true);
            } else if (allRaces[race].movement) {
                if (allRaces[race].movement.burrow > targetActor.system.attributes.movement.burrow) setProperty(updates, 'actor.system.attributes.movement.burrow', allRaces[race].movement.burrow);
                if (allRaces[race].movement.climb > targetActor.system.attributes.movement.climb) setProperty(updates, 'actor.system.attributes.movement.climb', allRaces[race].movement.climb);
                if (allRaces[race].movement.fly > targetActor.system.attributes.movement.fly) setProperty(updates, 'actor.system.attributes.movement.fly', allRaces[race].movement.fly);
                if (allRaces[race].movement.swim > targetActor.system.attributes.movement.swim) setProperty(updates, 'actor.system.attributes.movement.swim', allRaces[race].movement.swim);
                if (allRaces[race].movement.walk > targetActor.system.attributes.movement.walk) setProperty(updates, 'actor.system.attributes.movement.walk', allRaces[race].movement.walk);
                if (allRaces[race].movement.hover) setProperty(updates, 'actor.system.attributes.movement.hover', true);
            }
            break;
        case 'downgrade':
            if (sourceActor) {
                if (sourceActor.system.attributes.movement.burrow < targetActor.system.attributes.movement.burrow) setProperty(updates, 'actor.system.attributes.movement.burrow', sourceActor.system.attributes.movement.burrow);
                if (sourceActor.system.attributes.movement.climb < targetActor.system.attributes.movement.climb) setProperty(updates, 'actor.system.attributes.movement.climb', sourceActor.system.attributes.movement.climb);
                if (sourceActor.system.attributes.movement.fly < targetActor.system.attributes.movement.fly) setProperty(updates, 'actor.system.attributes.movement.fly', sourceActor.system.attributes.movement.fly);
                if (sourceActor.system.attributes.movement.swim < targetActor.system.attributes.movement.swim) setProperty(updates, 'actor.system.attributes.movement.swim', sourceActor.system.attributes.movement.swim);
                if (sourceActor.system.attributes.movement.walk < targetActor.system.attributes.movement.walk) setProperty(updates, 'actor.system.attributes.movement.walk', sourceActor.system.attributes.movement.walk);
                if (sourceActor.system.attributes.movement.hover) setProperty(updates, 'actor.system.attributes.movement.hover', true);
            } else if (allRaces[race].movement) {
                if (allRaces[race].movement.burrow < targetActor.system.attributes.movement.burrow) setProperty(updates, 'actor.system.attributes.movement.burrow', allRaces[race].movement.burrow);
                if (allRaces[race].movement.climb < targetActor.system.attributes.movement.climb) setProperty(updates, 'actor.system.attributes.movement.climb', allRaces[race].movement.climb);
                if (allRaces[race].movement.fly < targetActor.system.attributes.movement.fly) setProperty(updates, 'actor.system.attributes.movement.fly', allRaces[race].movement.fly);
                if (allRaces[race].movement.swim < targetActor.system.attributes.movement.swim) setProperty(updates, 'actor.system.attributes.movement.swim', allRaces[race].movement.swim);
                if (allRaces[race].movement.walk < targetActor.system.attributes.movement.walk) setProperty(updates, 'actor.system.attributes.movement.walk', allRaces[race].movement.walk);
                if (allRaces[race].movement.hover) setProperty(updates, 'actor.system.attributes.movement.hover', true);
            }
            break;
    }
    let senses = chris.getConfiguration(item, 'senses') ?? 'source';
    if (senses === 'source') {
        if (sourceActor) {
            setProperty(updates, 'actor.system.attributes.senses', sourceActor.system.attributes.senses);
            setProperty(updates, 'actor.prototypeToken.sight', sourceActor.prototypeToken.sight);
            setProperty(updates, 'token.sight', sourceActor.prototypeToken.sight);
        } else if (allRaces[race].senses && allRaces[race].sight) {
            setProperty(updates, 'actor.system.attributes.senses', allRaces[race].senses);
            setProperty(updates, 'actor.prototypeToken.sight', allRaces[race].sight);
            setProperty(updates, 'token.sight', allRaces[race].sight);
        }
    }
    if (allRaces[race].size) {
        switch (allRaces[race].size) {
            case 'small':
                setProperty(updates, 'actor.system.traits.size', 'sm');
                setProperty(updates, 'token.texture.scaleX', 0.8);
                setProperty(updates, 'token.texture.scaleY', 0.8);
                setProperty(updates, 'actor.prototypeToken.texture.scaleX', 0.8)
                setProperty(updates, 'actor.prototypeToken.texture.scaleY', 0.8)
                break;
        }
    }
    if (allRaces[race].special) await allRaces[race].special(targetActor, updates);
    if (allRaces[race].specialTraits) setProperty(updates, 'actor.flags.dnd5e', allRaces[race].specialTraits);

}