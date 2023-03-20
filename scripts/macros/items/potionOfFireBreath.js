import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Item Features', 'Potion of Fire Breath Attack', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Potion of Fire Breath Attack');
    async function effectMacro () {
		await warpgate.revert(token.document, 'Potion of Fire Breath');
	}
    let effectData = {
        'label': 'Potion of Fire Breath',
        'icon': this.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': this.actor.uuid, //Not the item UUID due to being a consumable.
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
    await warpgate.mutate(this.token.document, updates, {}, options);
}
async function breath({speaker, actor, token, character, item, args}) {
    if (this.item.system.uses.value != 0) return;
    await warpgate.revert(this.token.document, 'Potion of Fire Breath');
}
export let potionOfFireBreath = {
    'item': item,
    'breath': breath
}