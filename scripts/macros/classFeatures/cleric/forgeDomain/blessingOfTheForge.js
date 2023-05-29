import {chris} from '../../../../helperFunctions.js';
export async function blessingOfTheForge({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let generatedMenu = [];
    targetActor.items.forEach(item => {
        if (!item.system.equipped ) return;
        if (item.type === 'weapon' || item.system.armor) generatedMenu.push([item.name, item.id]);
    });
    if (generatedMenu.length === 0) return;
    let selection = await chris.dialog('What item do you imbue?', generatedMenu);
    if (!selection) return;
    async function effectMacro() {
        warpgate.revert(token.document, 'Blessing of the Forge');
    }
    let itemData = targetActor.items.get(selection).toObject();
    if (itemData.type === 'weapon') {
        itemData.system.attackBonus = Number(itemData.system.attackBonus) + 1;
        itemData.system.damage.parts[0][0] += ' + 1';
    } else {
        itemData.system.armor.value += 1;
    }
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 604800
        },
        'flags': {
            'dae': {
                'specialDuration': [
                    'longRest'
                ]
            },
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [itemData.name]: itemData
            },
            'ActiveEffect': {
                [workflow.item.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Blessing of the Forge',
        'description': 'Blessing of the Forge'
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
}