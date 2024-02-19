import {chris} from '../../../../helperFunctions.js';
export async function experimentalElixir({speaker, actor, token, character, item, args, scope, workflow}) {
    let roll = await new Roll('1d6').roll({'async': true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Experimental Elixir'
    });
    let itemName;
    switch (roll.total) {
        case 1:
            itemName = 'Experimental Elixir - Healing';
            break;
        case 2:
            itemName = 'Experimental Elixir - Swiftness';
            break;
        case 3:
            itemName = 'Experimental Elixir - Resilience';
            break;
        case 4:
            itemName = 'Experimental Elixir - Boldness';
            break;
        case 5:
            itemName = 'Experimental Elixir - Flight';
            break;
        case 6:
            itemName = 'Experimental Elixir - Transformation';
            break;
    }
    let feature = workflow.actor.items.getName(itemName);
    if (feature) {
        feature.update({
            'system.quantity': item.system.quantity + 1
        });
    } else {
        let itemData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', itemName, false);
        if (!itemData) return;
        itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', itemName);
        if (itemName === 'Experimental Elixir - Healing') {
            itemData.system.damage.parts = [
                [
                    '2d4[healing] + ' + workflow.actor.system.abilities.int.mod,
                    'healing'
                ]
            ];
        }
        if (workflow.actor.classes.artificer?.system?.levels >= 9) {
            if (!itemData.system.damage.parts) itemData.system.damage.parts = [];
            itemData.system.damage.parts.push([
                '2d6[temphp] + ' + workflow.actor.system.abilities.int.mod,
                'temphp'
            ]);
        }
        let effectData = {
            'name': itemData.name + ' Item',
            'icon': '', //Blank to avoid showing up as a status icon.
            'duration': {
                'seconds': 604800
            },
            'origin': workflow.item.uuid,
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': "warpgate.revert(token.document, '" + itemData.name + " Item');"
                    }
                },
                'dae': {
                    'transfer': false,
                    'specialDuration': [
                        'longRest'
                    ],
                    'stackable': 'multi',
                    'macroRepeat': 'none'
                }
            }
        };
        let updates = {
            'embedded': {
                'Item': {
                    [itemData.name]: itemData
                },
                'ActiveEffect': {
                    [effectData.name]: effectData
                }
            }
        };
        let options = {
            'permanent': false,
            'name': effectData.name,
            'description': effectData.name
        };
        await warpgate.mutate(workflow.token.document, updates, {}, options);
    }
}