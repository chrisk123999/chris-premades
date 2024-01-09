import {chris} from '../../../../helperFunctions.js';
export async function hexWarrior({speaker, actor, token, character, item, args, scope, workflow}) {
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && !i.system.properties?.two && i.system.equipped);
    if (!weapons.length) {
        ui.notifications.info('No valid equipped weapons to pick!');
    }
    let selection;
    if (weapons.length === 1) {
        selection = weapons[0];
    } else {
        [selection] = await chris.selectDocument('Select a Weapon', weapons);
    }
    if (!selection) return;
    let weaponData = duplicate(selection.toObject());
    let cha = workflow.actor.system.abilities.cha.mod;
    let ability = weaponData.system.ability === '' ? 'str' : weaponData.system.ability;
    let score = workflow.actor.system.abilities[ability].mod;
    let dex = workflow.actor.system.abilities.dex.mod;
    let changed = false;
    if (weaponData.system.properties.fin) {
        let mod = dex > score ? dex : score;
        if (mod <= cha) {
            ability = 'cha';
            changed = true;
        }
    } else {
        if (score <= cha) {
            ability = 'cha';
            changed = true;
        }
    }
    if (changed) weaponData.system.ability = ability;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Hex Warrior');
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 604800
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': weaponData.name
                }
            },
            'dae': {
                'specialDuration': [
                    'longRest'
                ]
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [weaponData.name]: weaponData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Hex Warrior',
        'description': 'Hex Warrior'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}