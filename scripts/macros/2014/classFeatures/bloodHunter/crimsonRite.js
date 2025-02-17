import {dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let damageDice = workflow.actor.system.scale?.['blood-hunter']?.['crimson-rite']?.formula;
    if (!damageDice) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.MissingScale', {scaleName: 'crimson-rite'}), 'warn');
        workflow.aborted = true;
        return;
    }
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
                key: 'system.damage.parts',
                mode: 2,
                value: JSON.stringify([[damageDice, selection]]),
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
export let crimsonRite = {
    name: 'Crimson Rite',
    version: '1.1.0',
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
    ]
};