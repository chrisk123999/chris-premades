const eventStructure = {
    check: [
        {
            pass: 'situational',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    save: [
        {
            pass: 'situational',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    aura: [
        {
            pass: 'create',
            documents: [
                'item',
                'effect'
            ],
            requiredValues: [
                {
                    key: 'distance',
                    types: [Number] // Any positive number.
                },
                {
                    key: 'identifier',
                    types: [String] // The CPR effect identifier for the aura while it's on a target. Must not be the same as the entity's CPR identifier! Generally this is the entity identifier + 'Aura'.
                }
            ],
            optionalValues: [
                {
                    key: 'disposition',
                    types: [String] // 'ally', 'enemy', 'neutral', null (all)
                },
                {
                    key: 'conscious',
                    types: [Boolean] // true requires the aura giver to be conscious.
                }
            ]
        }
    ],
    combat: [
        {
            pass: 'turnEnd',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'turnStart',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'everyTurn',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'turnEndNear',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            optionalValues: [
                {
                    key: 'distance',
                    types: [Number] // Any positive number or null for unlimited range.
                },
                {
                    key: 'disposition',
                    types: [String] // 'ally', 'enemy', 'neutral', null (all)
                }
            ]
        },
        {
            pass: 'turnStartNear',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            optionalValues: [
                {
                    key: 'distance',
                    types: [Number] // Any positive number or null for unlimited range.
                },
                {
                    key: 'disposition',
                    types: [String] // 'ally', 'enemy', 'neutral', null (all)
                }
            ]
        },
        {
            pass: 'combatStart',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'combatEnd',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    createItem: [
        {
            pass: 'created',
            documents: [
                'item'
            ]
        }
    ],
    death: [
        {
            pass: 'dead',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    effect: [
        {
            pass: 'created',
            documents: [
                'effect'
            ]
        },
        {
            pass: 'deleted',
            documents: [
                'effect'
            ]
        },
        {
            pass: 'preCreateEffect',
            documents: []
        },
        {
            pass: 'preUpdateEffect',
            documents: []
        }
    ],
    midi: [
        {
            pass: 'preTargeting',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'preItemRoll',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target'
            ]
        },
        {
            pass: 'preambleComplete',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'postAttackRoll',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'attackRollComplete',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'savesComplete',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target'
            ]
        },
        {
            pass: 'damageRollComplete',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'rollFinished',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'applyDamage',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        }
    ],
    movement: [
        {
            pass: 'moved',
            documents: [
                'item',
                'effect'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'movedNear',
            documents: [
                'item',
                'effect'
            ]
        }
    ],
    region: [
        {
            pass: 'left',
            documents: [
                'region'
            ]
        },
        {
            pass: 'enter',
            documents: [
                'region'
            ]
        },
        {
            pass: 'stay',
            documents: [
                'region'
            ]
        },
        {
            pass: 'passedThrough',
            documents: [
                'region'
            ]
        }
    ],
    rest: [
        {
            pass: 'short',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'long',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    skill: [
        {
            pass: 'situational',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    template: [
        {
            pass: 'left',
            documents: [
                'template'
            ]
        },
        {
            pass: 'enter',
            documents: [
                'template'
            ]
        },
        {
            pass: 'stay',
            documents: [
                'template'
            ]
        },
        {
            pass: 'passedThrough',
            documents: [
                'template'
            ]
        },
        {
            pass: 'moved',
            documents: [
                'template'
            ]
        }
    ]
};
export function getDocumentPasses(document, type) {
    let documentType = document.documentName.toLowerCase();
    let passes = [];
    eventStructure[type]?.forEach(i => {
        if (i.documents.includes(documentType)) passes.push(i.pass);
        if (i.options) i.options.forEach(option => {
            passes.push(option + i.pass.capitalize());
        });
    });
    return passes;
}

export function getEventTypes() {
    return Object.keys(eventStructure);
}
export function getAllDocumentPasses(document) {
    let passes = {};
    getEventTypes().forEach(i => {
        passes[i] = getDocumentPasses(document, i);
    });
    return passes;
}