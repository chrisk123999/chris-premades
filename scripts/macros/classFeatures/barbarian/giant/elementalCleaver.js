import {chris} from '../../../../helperFunctions.js';
async function mutate(workflow, selected) {
    let damageType = await chris.dialog(workflow.item.name, [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['☁️ Thunder', 'thunder'], ['⚡ Lightning', 'lightning']], 'What damage type?');
    if (!damageType) return;
    let parts = duplicate(selected.system.damage.parts);
    for (let i = 0; i < parts.length; i++) {
        parts[i][0] = parts[i][0].replaceAll(parts[i][1], damageType);
        parts[i][1] = damageType;
    }
    let versatile = duplicate(selected.system.damage.versatile);
    let demiurgicColossus = chris.getItem(workflow.actor, 'Demiurgic Colossus');
    let bonusDice = demiurgicColossus ? 2 : 1;
    parts.push([bonusDice + 'd6[' + damageType + ']', damageType]);
    if (selected.system.damage.parts.length) versatile.replaceAll(selected.system.damage.parts[0][1], selected);
    if (versatile != '') versatile += ' + ' + bonusDice + 'd6[' + damageType + ']';
    async function effectMacro () {
        await warpgate.revert(token.document, 'Elemental Cleaver');
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Elemental Cleaver: Change Damage Type', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Elemental Cleaver: Change Damage Type');
    let effectData = {
        'name': 'Elemental Cleaver',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
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
                    'button': featureData.name
                },
                'feature': {
                    'elementalCleaver': {
                        'weapon': selected.id
                    }
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [selected.name]: {
                    'system': {
                        'damage': {
                            'parts': parts,
                            'versatile': versatile
                        },
                        'properties': {
                            'thr': true
                        },
                        'range': {
                            'long': 60,
                            'value': 20
                        }
                    }
                },
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [featureData.name]: effectData
            }
        }
    }
    let options = {
        'permanent': false,
        'name': 'Elemental Cleaver',
        'description': 'Elemental Cleaver'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.actor || !workflow.token) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.flags['chris-premades']?.info?.name != 'Unarmed Strike');
    if (!weapons.length) return;
    let selected;
    if (weapons.length === 1) {
        selected = weapons[0];
    } else {
        [selected] = await chris.selectDocument(workflow.item.name, weapons, false);
    }
    if (!selected) return;
    await mutate(workflow, selected);
}
async function change({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Elemental Cleaver');
    if (!effect) return;
    let weaponId = effect.flags['chris-premades']?.feature?.elementalCleaver?.weapon;
    if (!weaponId) return;
    let selected = workflow.actor.items.get(weaponId);
    if (!selected) return;
    await chris.removeEffect(effect);
    await mutate(workflow, selected);
}
export let elementalCleaver = {
    'item': item,
    'change': change,
    'mutate': mutate
}