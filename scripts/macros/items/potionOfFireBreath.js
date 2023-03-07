import {chris} from '../../helperFunctions.js';
async function item(workflow) {
    if (workflow.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Potion of Fire Breath Attack', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Potion of Fire Breath Attack');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Potion of Fire Breath');
	}
    let effectData = {
        'label': 'Potion of Fire Breath',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.actor.uuid, //Not the item UUID due to being a consumable.
        'flags': {
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
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': effectData.label,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function breath(workflow) {
    if (workflow.item.system.uses.value != 0) return;
    await warpgate.revert(workflow.token.document, 'Potion of Fire Breath');
}
export let potionOfFireBreath = {
    'item': item,
    'breath': breath
}