import {chris} from './helperFunctions.js';
let scaleData = {
    'ranger': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'favored-foe',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'number': 1,
                        'faces': 4
                    },
                    '6': {
                        'number': 1,
                        'faces': 6
                    },
                    '14': {
                        'number': 1,
                        'faces': 8
                    }
                }
            },
            'value': {},
            'title': 'Favored Foe'
        }
    ],
    'barbarian': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'rage',
                'type': 'number',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'value': 2
                    },
                    '9': {
                        'value': 3
                    },
                    '16': {
                        'value': 4
                    }
                }
            },
            'value': {},
            'title': 'Rage'
        }
    ],
    'blood-hunter': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'crimson-rite',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'number': 1,
                        'faces': 4
                    },
                    '5': {
                        'number': 1,
                        'faces': 6
                    },
                    '11': {
                        'number': 1,
                        'faces': 8
                    },
                    '17': {
                        'number': 1,
                        'faces': 10
                    }
                }
            },
            'value': {},
            'title': 'Crimson Rite'
        }
    ],
    'bard': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'bardic-inspiration',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'number': 1,
                        'faces': 6
                    },
                    '5': {
                        'number': 1,
                        'faces': 8
                    },
                    '10': {
                        'number': 1,
                        'faces': 10
                    },
                    '15': {
                        'number': 1,
                        'faces': 12
                    }
                }
            },
            'value': {},
            'title': 'Bardic Inspiration'
        }
    ],
    'rogue': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'sneak-attack',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'number': 1,
                        'faces': 6
                    },
                    '3': {
                        'number': 2,
                        'faces': 6
                    },
                    '5': {
                        'number': 3,
                        'faces': 6
                    },
                    '7': {
                        'number': 4,
                        'faces': 6
                    },
                    '9': {
                        'number': 5,
                        'faces': 6
                    },
                    '11': {
                        'number': 6,
                        'faces': 6
                    },
                    '13': {
                        'number': 7,
                        'faces': 6
                    },
                    '15': {
                        'number': 8,
                        'faces': 6
                    },
                    '17': {
                        'number': 9,
                        'faces': 6
                    },
                    '19': {
                        'number': 10,
                        'faces': 6
                    }
                }
            },
            'value': {},
            'title': 'Sneak Attack'
        }
    ],
    'battle-master': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'combat-superiority',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'number': 4,
                        'faces': 8
                    },
                    '7': {
                        'number': 5,
                        'faces': 8
                    },
                    '10': {
                        'number': 5,
                        'faces': 10
                    },
                    '15': {
                        'number': 6,
                        'faces': 10
                    },
                    '18': {
                        'number': 6,
                        'faces': 12
                    }
                }
            },
            'value': {},
            'title': 'Combat Superiority'
        }
    ],
    'way-of-the-ascendant-dragon': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'breath-of-the-dragon',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '3': {
                        'number': 2,
                        'faces': 4
                    },
                    '5': {
                        'number': 2,
                        'faces': 6
                    },
                    '11': {
                        'number': 3,
                        'faces': 8
                    },
                    '17': {
                        'number': 3,
                        'faces': 10
                    }
                }
            },
            'value': {},
            'title': 'Breath of the Dragon'
        }
    ],
    'artificer': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'arcane-jolt',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '9': {
                        'number': 2,
                        'faces': 6
                    },
                    '15': {
                        'number': 4,
                        'faces': 6
                    }
                }
            },
            'value': {},
            'title': 'Arcane Jolt'
        }
    ],
    'monk': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'quickened-healing',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '4': {
                        'number': 1,
                        'faces': 4
                    },
                    '5': {
                        'number': 1,
                        'faces': 6
                    },
                    '11': {
                        'number': 1,
                        'faces': 8
                    },
                    '17': {
                        'number': 1,
                        'faces': 10
                    }
                }
            },
            'value': {},
            'title': 'Quickened Healing'
        },
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'martial-arts',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '1': {
                        'number': 1,
                        'faces': 4
                    },
                    '5': {
                        'number': 1,
                        'faces': 6
                    },
                    '11': {
                        'number': 1,
                        'faces': 8
                    },
                    '17': {
                        'number': 1,
                        'faces': 10
                    }
                }
            },
            'value': {},
            'title': 'Martial Arts'
        }
    ],
    'fey-wanderer': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'dreadful-strikes',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '3': {
                        'number': 1,
                        'faces': 4
                    },
                    '11': {
                        'number': 1,
                        'faces': 6
                    }
                }
            },
            'value': {},
            'title': 'Dreadful Strikes'
        }
    ],
    'circle-of-stars': [
        {
            'type': 'ScaleValue',
            'configuration': {
                'identifier': 'starry-form',
                'type': 'dice',
                'distance': {
                    'units': ''
                },
                'scale': {
                    '2': {
                        'number': 1,
                        'faces': 8
                    },
                    '10': {
                        'number': 2,
                        'faces': 8
                    }
                }
            },
            'value': {},
            'title': 'Starry Form'
        }
    ]
};
async function addScale(item) {
    let identifier = item.system.identifier;
    let options = scaleData[identifier].map(i => [i.title, i.configuration.identifier]);
    let selection = await chris.dialog('⚖️ Add Scale', options);
    if (!selection) return;
    let itemData = duplicate(item.toObject());
    let advancementData = itemData.system.advancement;
    let scale = scaleData[identifier].find(i => i.configuration.identifier === selection);
    if (!scale) return;
    advancementData.push(scale);
    await item.update({'system.advancement': advancementData});
    ui.notifications.info(scale.tile + ' scale added!');
}
export let scale = {
    'scaleData': scaleData,
    'addScale': addScale
}