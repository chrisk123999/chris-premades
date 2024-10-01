import {DialogApp} from '../../applications/dialog.js';
import {actorUtils, compendiumUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
import {proneOnFail} from '../generic/proneOnFail.js';
async function used(actor, key, value) {
    await genericUtils.setFlag(actor, 'chris-premades', 'bg3WeaponActions.' + key, value);
}
async function backbreakerUse({trigger, workflow}) {
    await used(workflow.actor, 'backbreaker', trigger.entity.system.uses.value);
    await proneOnFail.midi.item[0].macro({workflow});
}
export let backbreaker = {
    name: 'Backbreaker',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: backbreakerUse,
                priority: 50
            }
        ]
    }
};
async function braceMeleeUse({trigger, workflow}) {
    await used(workflow.actor, 'braceMelee', trigger.entity.system.uses.value);
    let effectData = {
        name: trigger.entity.name,
        img: trigger.entity.img,
        origin: trigger.entity.uuid,
        duration: {
            seconds: 1
        },
        flags: {
            dae: {
                specialDuration: [
                    'turnEnd'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['braceMeleeDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'braceMeleeDamage'});
}
async function braceMeleeDamageUse({trigger, workflow}) {
    if (!workflow.item) return;
    if (!workflow.item.system.damage) return;
    if (!constants.meleeAttacks.includes(workflow.item.system.actionType)) return;
    let parts = workflow.item.system.damage.parts.map(i => {
        return [
            'max(' + i[0] + ', ' + i[0] + ')',
            i[1]
        ];
    });
    let versatile = workflow.item.system.damage.versatile == '' ? '' : 'max(' + workflow.item.system.damage.versatile + ', ' + workflow.item.system.damage.versatile + ')';
    workflow.item = workflow.item.clone({'system.damage.parts': parts, 'system.damage.versatile': versatile}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
export let braceMelee = {
    name: 'Brace (Melee)',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: braceMeleeUse,
                priority: 50
            }
        ]
    }
};
export let braceMeleeDamage = {
    name: braceMelee.name,
    version: braceMelee.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: braceMeleeDamageUse,
                priority: 100
            }
        ]
    }
};
async function cleaveUse({trigger, workflow}) {
    await used(workflow.actor, 'cleave', trigger.entity.system.uses.value);
}
export let cleave = {
    name: 'Cleave',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: cleaveUse,
                priority: 50
            }
        ]
    }
};
async function concussiveSmashUsed({trigger, workflow}) {
    await used(workflow.actor, 'concussiveSmash', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async token => {
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.BG3.Dazed'),
            img: 'modules/chris-premades/images/bg3/Dazed.webp',
            changes: [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ],
            duration: {
                seconds: 12
            },
            origin: workflow.item.uuid
        };
        let armorTypes = [
            'light',
            'medium',
            'heavy'
        ];
        let armor = token.actor.items.find(i => armorTypes.includes(i.system.armor?.type) && i.system.equipped);
        let dex;
        if (armor) {
            dex = !armor.system.armor.dex ? token.actor.system.abilities.dex.mod : Math.min(armor.system.armor.dex, token.actor.system.abilities.dex.mod);
        } else {
            dex = token.actor.system.abilities.dex.mod;
        }
        if (dex > 0) {
            effectData.changes.push({
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: -dex,
                priority: 20
            });
        }
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let concussiveSmash = {
    name: 'Concussive Smash',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: concussiveSmashUsed,
                priority: 50
            }
        ]
    }
};
async function maimingStrikeUse({trigger, workflow}) {
    await used(workflow.actor, 'maimingStrike', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.Maimed'),
        img: 'modules/chris-premades/images/bg3/Maimed.webp',
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.save.dex',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.attributes.movement.burrow',
                mode: 3,
                value: 0,
                priority: 20
            },
            {
                key: 'system.attributes.movement.climb',
                mode: 3,
                value: 0,
                priority: 20
            },
            {
                key: 'system.attributes.movement.swim',
                mode: 3,
                value: 0,
                priority: 20
            },
            {
                key: 'system.attributes.movement.walk',
                mode: 3,
                value: 0,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isHealed'
                ]
            }
        }
    };
    await Promise.all(workflow.failedSaves.map(async token => {
        if (token.actor.system.attributes.movement.fly > 0) return;
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let maimingStrike = {
    name: 'Maiming Strike',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: maimingStrikeUse,
                priority: 50
            }
        ]
    }
};
async function disarmingStrikeUse({trigger, workflow}) {
    await used(workflow.actor, 'disarmingStrike', trigger.entity.system.uses.value);
}
export let disarmingStrike = {
    name: 'Disarming Strike',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: disarmingStrikeUse,
                priority: 50
            }
        ]
    }
};
async function flourishUse({trigger, workflow}) {
    await used(workflow.actor, 'flourish', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.OffBalance'),
        img: 'modules/chris-premades/images/bg3/OffBalance.webp',
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.check.dex',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isDamaged'
                ]
            }
        }
    };
    await Promise.all(workflow.failedSaves.map(async token => effectUtils.createEffect(token.actor, effectData)));
}
export let flourish = {
    name: 'Flourish',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: flourishUse,
                priority: 50
            }
        ]
    }
};
async function heartstopperUse({trigger, workflow}) {
    await used(workflow.actor, 'heartstopper', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.ChestTrauma'),
        img: 'modules/chris-premades/images/bg3/ChestTrauma.webp',
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.save.con',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isHealed'
                ]
            }
        }
    };
    await Promise.all(workflow.failedSaves.map(async token => effectUtils.createEffect(token.actor, effectData)));
}
export let heartstopper = {
    name: 'Heartstopper',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: heartstopperUse,
                priority: 50
            }
        ]
    }
};
async function lacerateUse({trigger, workflow}) {
    await used(workflow.actor, 'lacerate', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.Bleeding'),
        img: 'modules/chris-premades/images/bg3/Bleeding.webp',
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: 'turn=start,allowIncapacitated=true,damageRoll=2[slashing],damageType=slashing',
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.save.con',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isHealed'
                ]
            }
        }
    };
    let invalidCreatures = [
        'construct',
        'undead'
    ];
    await Promise.all(workflow.failedSaves.map(async token => {
        if (invalidCreatures.includes(actorUtils.typeOrRace(token.actor))) return;
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let lacerate = {
    name: 'Lacerate',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: lacerateUse,
                priority: 50
            }
        ]
    }
};
async function piercingStrikeUse({trigger, workflow}) {
    await used(workflow.actor, 'piercingStrike', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.GapingWounds'),
        img: 'modules/chris-premades/images/bg3/GapingWounds.webp',
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isHealed'
                ]
            }
        }
    };
    let invalidCreatures = [
        'construct',
        'undead'
    ];
    effectUtils.addMacro(effectData, 'midi.actor', ['piercingStrikeEffect']);
    await Promise.all(workflow.failedSaves.map(async token => {
        if (invalidCreatures.includes(actorUtils.typeOrRace(token.actor))) return;
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
async function piercingStrikeDamage({trigger, workflow}) {
    if (!workflow.item) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    await workflowUtils.bonusDamage(workflow, '2', {ignoreCrit: true, damageType: 'piercing'});
}
export let piercingStrike = {
    name: 'Piercing Strike',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: piercingStrikeUse,
                priority: 50
            }
        ]
    }
};
export let piercingStrikeEffect = {
    name: piercingStrike.name,
    version: piercingStrike.version,
    midi: {
        actor: [
            {
                pass: 'targetDamageRollComplete',
                macro: piercingStrikeDamage,
                priority: 250
            }
        ]
    }
};
async function pommelStrikeUse({trigger, workflow}) {
    await used(workflow.actor, 'pommelStrike', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async token => {
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.BG3.Dazed'),
            img: 'modules/chris-premades/images/bg3/Dazed.webp',
            changes: [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ],
            duration: {
                seconds: 12
            },
            origin: workflow.item.uuid
        };
        let armorTypes = [
            'light',
            'medium',
            'heavy'
        ];
        let armor = token.actor.items.find(i => armorTypes.includes(i.system.armor?.type) && i.system.equipped);
        let dex;
        if (armor) {
            dex = !armor.system.armor.dex ? token.actor.system.abilities.dex.mod : Math.min(armor.system.armor.dex, token.actor.system.abilities.dex.mod);
        } else {
            dex = token.actor.system.abilities.dex.mod;
        }
        if (dex > 0) {
            effectData.changes.push({
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: -dex,
                priority: 20
            });
        }
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let pommelStrike = {
    name: 'Pommel Strike',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: pommelStrikeUse,
                priority: 50
            }
        ]
    }
};
async function prepareUse({trigger, workflow}) {
    await used(workflow.actor, 'pommelStrike', trigger.entity.system.uses.value);
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        changes: [
            {
                key: 'system.bonuses.mwak.damage',
                mode: 2,
                value: '+ @abilities.str.mod[slashing]',
                priority: 20
            }
        ],
        duration: {
            seconds: 1
        },
        origin: workflow.item.uuid
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let prepare = {
    name: 'Prepare',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: prepareUse,
                priority: 50
            }
        ]
    }
};
async function rushUse({trigger, workflow}) {
    await used(workflow.actor, 'rush', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.OffBalance'),
        img: 'modules/chris-premades/images/bg3/OffBalance.webp',
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.str',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.check.dex',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isDamaged'
                ]
            }
        }
    };
    await Promise.all(workflow.failedSaves.map(async token => effectUtils.createEffect(token.actor, effectData)));
}
export let rush = {
    name: 'Rush',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: rushUse,
                priority: 50
            }
        ]
    }
};
async function tenacityUse({trigger, workflow}) {
    await used(workflow.actor, 'tenacity', trigger.entity.system.uses.value);
}
export let tenacity = {
    name: 'Tenacity',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: tenacityUse,
                priority: 50
            }
        ]
    }
};
async function toppleUse({trigger, workflow}) {
    await used(workflow.actor, 'topple', trigger.entity.system.uses.value);
    await proneOnFail.midi.item[0].macro({workflow});
}
export let topple = {
    name: 'Topple',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: toppleUse,
                priority: 50
            }
        ]
    }
};
async function weakeningStrikeUse({trigger, workflow}) {
    await used(workflow.actor, 'weakeningStrike', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.WeakGrip'),
        img: 'modules/chris-premades/images/bg3/WeakGrip.webp',
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.disadvantage.ability.save.str',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['piercingStrikeEffect']);
    await Promise.all(workflow.failedSaves.map(async token => {
        let weapons = token.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
        if (!weapons.length) return;
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let weakeningStrike = {
    name: 'Weakening Strike',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: weakeningStrikeUse,
                priority: 50
            }
        ]
    }
};
async function braceRangedUse({trigger, workflow}) {
    await used(workflow.actor, 'braceRanged', trigger.entity.system.uses.value);
    let effectData = {
        name: trigger.entity.name,
        img: trigger.entity.img,
        origin: trigger.entity.uuid,
        duration: {
            seconds: 1
        },
        flags: {
            dae: {
                specialDuration: [
                    'turnEnd'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['braceRangedDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'braceRangedDamage'});
}
async function braceRangedDamageUse({trigger, workflow}) {
    if (!workflow.item) return;
    if (!workflow.item.system.damage) return;
    if (!constants.rangedAttacks.includes(workflow.item.system.actionType)) return;
    let parts = workflow.item.system.damage.parts.map(i => {
        return [
            'max(' + i[0] + ', ' + i[0] + ')',
            i[1]
        ];
    });
    let versatile = workflow.item.system.damage.versatile == '' ? '' : 'max(' + workflow.item.system.damage.versatile + ', ' + workflow.item.system.damage.versatile + ')';
    workflow.item = workflow.item.clone({'system.damage.parts': parts, 'system.damage.versatile': versatile}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
export let braceRanged = {
    name: 'Brace (Ranged)',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: braceRangedUse,
                priority: 50
            }
        ]
    }
};
export let braceRangedDamage = {
    name: braceMelee.name,
    version: braceMelee.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: braceRangedDamageUse,
                priority: 100
            }
        ]
    }
};
async function hamstringShotUse({trigger, workflow}) {
    await used(workflow.actor, 'hamstringShot', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.Hamstrung'),
        img: 'modules/chris-premades/images/bg3/Hamstrung.webp',
        changes: [
            {
                key: 'system.attributes.movement.all',
                mode: 0,
                value: '/2',
                priority: 20
            }
        ],
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isHealed'
                ]
            }
        }
    };
    await Promise.all(workflow.failedSaves.map(async token => effectUtils.createEffect(token.actor, effectData)));
}
export let hamstringShot = {
    name: 'Hamstring Shot',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: hamstringShotUse,
                priority: 50
            }
        ]
    }
};
async function mobileShotUse({trigger, workflow}) {
    await used(workflow.actor, 'mobileShot', trigger.entity.system.uses.value);
}
export let mobileShot = {
    name: 'Hamstring Shot',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: mobileShotUse,
                priority: 50
            }
        ]
    }
};
async function piercingShotUse({trigger, workflow}) {
    await used(workflow.actor, 'piercingShot', trigger.entity.system.uses.value);
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.BG3.GapingWounds'),
        img: 'modules/chris-premades/images/bg3/GapingWounds.webp',
        duration: {
            seconds: 12
        },
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'isHealed'
                ]
            }
        }
    };
    let invalidCreatures = [
        'construct',
        'undead'
    ];
    effectUtils.addMacro(effectData, 'midi.actor', ['piercingStrikeEffect']);
    await Promise.all(workflow.failedSaves.map(async token => {
        if (invalidCreatures.includes(actorUtils.typeOrRace(token.actor))) return;
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let piercingShot = {
    name: 'Piercing Shot',
    version: '0.12.84',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: piercingShotUse,
                priority: 50
            }
        ]
    }
};
let bg3Identifiers = [
    'backbreaker',
    'braceMelee',
    'cleave',
    'concussiveSmash',
    'maimingStrike',
    'disarmingStrike',
    'flourish',
    'heartstopper',
    'lacerate',
    'piercingStrike',
    'pommelStrike',
    'prepare',
    'rush',
    'tenacity',
    'topple',
    'weakeningStrike',
    'braceRanged',
    'hamstringShot',
    'mobileShot',
    'piercingShot'
];
async function changeItem(item, equipped) {
    let removeIds = [];
    bg3Identifiers.forEach(i => {
        let bg3Item = itemUtils.getItemByIdentifier(item.actor, i);
        if (bg3Item) removeIds.push(bg3Item.id);
    });
    if (removeIds.length) await genericUtils.deleteEmbeddedDocuments(item.actor, 'Item', removeIds);
    let equippedWeapons = item.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && itemUtils.isWeaponProficient(i));
    if (equipped && itemUtils.isWeaponProficient(item)) {
        equippedWeapons.push(item);
    } else if (!equipped && itemUtils.isWeaponProficient(item)) {
        equippedWeapons = equippedWeapons.filter(i => i.id != item.id);
    }
    if (!equippedWeapons.length) return;
    let settings = genericUtils.getCPRSetting('bg3WeaponActionConfig');
    let maxUses = genericUtils.getCPRSetting('bg3WeaponActionUses');
    let addItems = [];
    let addIdentifiers = new Set();
    let pack = game.packs.get(constants.packs.miscellaneousItems);
    if (!pack) return;
    let index = await pack.getIndex({fields: ['flags.chris-premades.info.identifier']});
    await Promise.all(Object.entries(settings).map(async ([key, value]) => {
        if (addIdentifiers.has(key)) return;
        await Promise.all(value.map(async j => {
            let weapon = equippedWeapons.find(k => k.system.type.baseItem === j);
            if (!weapon) return;
            addIdentifiers.add(key);
            let feature = index.find(l => l.flags['chris-premades']?.info?.identifier === key);
            if (!feature) return;
            let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneousItems, feature.name, {object: true, translate: 'CHRISPREMADES.BG3.' + key.capitalize(), getDescription: true});
            if (!featureData) return;
            switch (key) {
                case 'backbreaker':
                case 'maimingStrike':
                case 'disarmingStrike':
                case 'heartstopper':
                case 'rushAttack':
                case 'weakeningStrike':
                    featureData.system.damage.parts = [
                        [
                            featureData.system.damage.parts[0][0].replace('bludgeoning', weapon.system.damage.parts[0][1]),
                            weapon.system.damage.parts[0][1]
                        ]
                    ];
                    break;
                case 'cleave':
                    featureData.system.damage.parts = genericUtils.duplicate(weapon.toObject()).system.damage.parts.map(m => {
                        return [
                            '(' + m[0] + ' / 2)',
                            m[1]
                        ];
                    });
                    break;
                case 'concussiveSmash':
                case 'lacerate':
                case 'piercingStrike':
                case 'hamstringShot':
                case 'mobileShot':
                case 'piercingShot':
                    featureData.system.damage.parts = genericUtils.duplicate(weapon.toObject()).system.damage.parts;
                    break;
            }
            if (weapon.system.properties.has('mgc')) {
                featureData.system.properties.push('mgc');
                if (weapon.system.magicalBonus) featureData.system.magicalBonus = weapon.system.magicalBonus;
            }
            let rangedKeys = [
                'braceRanged',
                'hamstringShot',
                'mobileShot',
                'piercingShot'
            ];
            if (rangedKeys.includes(key)) {
                featureData.system.range = weapon.system.range;
            } else {
                featureData.system.range.value = weapon.system.properties.has('thr') ? 5 : weapon.system.range.value;
            }
            featureData.system.ability = weapon.system.ability === '' ? 'str' : weapon.system.ability;
            if (weapon.system.properties.has('fin') && weapon.system.ability === '' && item.actor.system.abilities.dex.mod >= item.actor.system.abilities.str.mod) {
                featureData.system.ability = 'dex';
            }
            featureData.system.save.scaling = featureData.system.ability;
            featureData.system.uses.value = item.actor.flags['chris-premades']?.bg3WeaponActions?.[key] ?? maxUses;
            featureData.system.uses.max = maxUses;
            delete featureData._id;
            addItems.push(featureData);
        }));
    }));
    if (addItems.length) await genericUtils.createEmbeddedDocuments(item.actor, 'Item', addItems);
}
async function configure() {
    let baseItems = (await Promise.all(Object.entries(CONFIG.DND5E.weaponIds).map(async ([key, value]) => {
        let packKey = 'dnd5e.items';
        let id;
        if (value.includes('.')) {
            let nameSplit = value.split('.');
            packKey = nameSplit[0] + '.' + nameSplit[1];
            id = nameSplit[2];
        } else {
            id = value;
        }
        let pack = game.packs.get(packKey);
        if (!pack) return;
        let index = await pack.getIndex();
        let name = index.find(i => i._id === id)?.name;
        if (!name) return;
        return {
            label: name,
            value: key
        };
    }))).filter(j => j).sort((a, b) => a.label.localeCompare(b.label, 'en', {'sensitivity': 'base'}));
    let oldSettings = genericUtils.getCPRSetting('bg3WeaponActionConfig');
    let inputs = bg3Identifiers.map(i => ({
        label: 'CHRISPREMADES.BG3.' + i.capitalize(),
        name: i,
        options: {
            value: oldSettings[i],
            options: baseItems
        }
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.bg3WeaponActionConfig.Name', 'CHRISPREMADES.Settings.bg3WeaponActionConfig.Hint', [['selectMany', inputs, {displayAsRows: true}]], 'okCancel', {id: 'cpr-configure-bg3', width: 400, height: 800});
    if (!selection?.buttons) return;
    delete selection.buttons;
    await game.settings.set('chris-premades', 'bg3WeaponActionConfig', selection);
}
async function rest(actor) {
    await genericUtils.update(actor, {'flags.chris-premades.-=bg3WeaponActions': null});
}
export let bg3 = {
    changeItem,
    configure,
    rest
};