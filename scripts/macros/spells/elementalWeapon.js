import {chris} from '../../helperFunctions.js';
export async function elementalWeapon({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let weapons = targetActor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.equipped);
    if (!weapons.length) {
        ui.notifications.warn('Target has no valid non-magical equipped weapons!');
        return;
    }
    let selection;
    if (weapons.length === 1) {
        selection = [weapons[0]];
    } else {
        selection = await chris.selectDocument(workflow.item.name, weapons);
        if (!selection) return;
    }
    let damageType = await chris.dialog(workflow.item.name, [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☁️ Thunder', 'thunder']], 'What damage type?');
    if (!damageType) return;
    let castLevel = workflow.castData.castLevel;
    let bonus = 1;
    if (castLevel >= 5 && castLevel < 7) {
        bonus = 2;
    } else if (castLevel > 7) {
        bonus = 3;
    }
    let damageParts = duplicate(selection[0].system.damage.parts);
    damageParts.push([bonus + 'd4[' + damageType + ']', damageType]);
    let versatile = duplicate(selection[0].system.damage.versatile);
    if (versatile != '') versatile += ' + ' + bonus + 'd4[' + damageType + ']';
    async function effectMacro () {
        await warpgate.revert(token.document, 'Elemental Weapon');
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
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
                    'button': selection[0].name
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [selection[0].name]: {
                    'system': {
                        'damage': {
                            'parts': damageParts,
                            'versatile': versatile
                        },
                        'attackBonus': bonus
                    }
                }
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Elemental Weapon',
        'description': 'Elemental Weapon'
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
    await chris.addDependent(MidiQOL.getConcentrationEffect(workflow.actor, workflow.item), [targetToken.actor.effects.getName(workflow.item.name)]);
}
