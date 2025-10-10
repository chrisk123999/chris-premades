import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({workflow}) {
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier');
    let scale = workflow.actor.system.scale?.[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (!weapons.length) return;
    let selectedWeapon;
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.HexWarrior.NoWeapons', 'info');
        return;
    }
    let riteIds = [
        ['riteOfTheFlame', 'fire'], 
        ['riteOfTheFrozen', 'cold'], 
        ['riteOfTheStorm', 'lightning'], 
        ['riteOfTheDead', 'necrotic'], 
        ['riteOfTheOracle', 'psychic'], 
        ['riteOfTheRoar', 'thunder'],
        ['riteOfTheDawn', 'radiant']
    ];
    let riteButtons = [];
    for (let [id, type] of riteIds) {
        let item = itemUtils.getItemByIdentifier(workflow.actor, id);
        if (item) riteButtons.push([item.name, type]);
    }
    if (!riteButtons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.CrimsonRite.NoRites', 'info');
        return;
    }
    if (weapons.length === 1) selectedWeapon = weapons[0];
    if (!selectedWeapon) selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.CrimsonRite.Weapon', weapons);
    if (!selectedWeapon) return;
    let selection;
    if (riteButtons.length === 1) selection = riteButtons[0][1];
    if (!selection) selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.CrimsonRite.Select', riteButtons);
    if (!selection) return;
    let enchantData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + workflow.item.name + ')',
                priority: 20
            },
            {
                key: 'system.properties',
                mode: 2,
                value: 'mgc',
                priority: 20
            },
            {
                key: 'activities[attack].damage.parts',
                mode: 2,
                value: JSON.stringify({denomination: scale.faces, number: scale.number, types: selection}),
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                crimsonRite: {
                    chosenRite: riteIds.find(i => i[1] === selection)[0]
                }
            }
        }
    };
    let effect = Array.from(selectedWeapon.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'crimsonRite');
    if (effect) await genericUtils.remove(effect);
    effect = await itemUtils.enchantItem(selectedWeapon, enchantData, {identifier: 'crimsonRite'});
    if (!effect) return;
    if (selection === 'radiant') {
        let effectData = {
            name: riteButtons.find(i => i[1] === selection)[0],
            img: workflow.item.img,
            origin: selectedWeapon.uuid,
            changes: [
                {
                    key: 'ATL.light.bright',
                    mode: 4,
                    value: 20,
                    priority: 20
                },
                {
                    key: 'system.traits.dr.value',
                    mode: 2,
                    value: 'necrotic',
                    priority: 20
                }
            ],
            flags: {
                'chris-premades': {
                    effect: {
                        noAnimation: true
                    }
                }
            }
        };
        effectUtils.addMacro(effectData, 'midi.actor', ['riteOfTheDawn']);
        await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: effect});
    }
}
async function rest({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    let weapons = actor.items.filter(i => i.type === 'weapon');
    for (let weapon of weapons) {
        let effect = Array.from(weapon.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'crimsonRite');
        if (effect) await genericUtils.remove(effect);
    }
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let crimsonRite = {
    name: 'Crimson Rite',
    version: '1.3.97',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'blood-hunter',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'crimson-rite',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'crimson-rite',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        2: {
                            number: 1,
                            faces: 4,
                            modifiers: []
                        },
                        5: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        11: {
                            number: 1,
                            faces: 8,
                            modifiers: []
                        },
                        17: {
                            number: 1,
                            faces: 10,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Crimson Rite'
            }
        }
    ]
};