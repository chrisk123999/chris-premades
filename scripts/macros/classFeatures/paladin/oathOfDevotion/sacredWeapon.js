import {chris} from '../../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let mutationStack = warpgate.mutationStack(workflow.token.document);
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && !mutationStack.getName(i.name));
    if (weapons.length === 0) return;
    let selection;
    if (weapons.length != 1) {
        let selection2 = await chris.selectDocument(workflow.item.name, weapons, false);
        if (selection2) selection = selection2[0];
    } else {
        selection = weapons[0];
    }
    if (!selection) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Sacred Weapon - Dismiss', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Sacred Weapon - Dismiss');
    async function effectMacro() {
        await warpgate.revert(token.document, 'Sacred Weapon');
    }
    let effectData = {
        'name': 'Sacred Weapon',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'ATL.light.dim',
                'mode': 4,
                'value': '40',
                'priority': 20
            },
            {
                'key': 'ATL.light.bright',
                'mode': 4,
                'value': '20',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'zeroHP'
                ]
            },
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };
    let attackBonus = Math.max(1, workflow.actor.system.abilities.cha.mod);
    if (selection.system.attackBonus != '') {
        attackBonus = selection.system.attackBonus + ' + ' + attackBonus;
    }
    let updates = {
        'embedded': {
            'Item': {
                [selection.name]: {
                    'system': {
                        'attackBonus': attackBonus,
                        'properties': {
                            'mgc': true
                        }
                    }
                },
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Sacred Weapon',
        'description': 'Sacred Weapon'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function dismiss({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Sacred Weapon');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let sacredWeapon = {
    'item': item,
    'dismiss': dismiss
}