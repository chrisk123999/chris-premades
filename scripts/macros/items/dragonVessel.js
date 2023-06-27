import {chris} from '../../helperFunctions.js';
export async function dragonVessel({speaker, actor, token, character, item, args, scope, workflow}) {
    let level = workflow.actor.flags['chris-premades']?.item?.dragonVessel?.level;
    if (level === undefined) return;
    let options = [
        ['Ale', false],
        ['Olive Oil', false],
        ['Potion of Healing (Normal)', 'Potion of Healing (Normal)'],
        ['Potion of Climbing', 'Potion of Climbing']
    ];
    if (level > 0) {
        options.push(['Mead', false]);
        options.push(['Potion of Fire Breath', 'Potion of Fire Breath']);
        options.push(['Potion of Healing (Greater)', 'Potion of Healing (Greater)']);
    }
    if (level > 1) {
        options.push(['Wine', false]);
        options.push(['Potion of Flying', 'Potion of Flying']);
        options.push(['Potion of Healing (Superior)', 'Potion of Healing (Superior)']);
    }
    if (level > 2) {
        options.push(['Whiskey', false]);
        options.push(['Potion of Healing (Supreme)', 'Potion of Healing (Supreme)']);
        options.push(['Potion of Dragon\'s Majesty', 'Potion of Dragon\'s Majesty']);
    }
    let selection = await chris.dialog('What item?', options);
    if (!selection) return;
    let itemData;
    if (selection === 'Potion of Fire Breath') {
        itemData = await chris.getItemFromCompendium('chris-premades.CPR Items', 'Potion of Fire Breath', false);
        if (!itemData) return;
        itemData.system.description.value = await chris.getCompendiumItemDescription('Potion of Fire Breath');
    }
    if (!itemData) itemData = await chris.getItemFromCompendium(game.settings.get('chris-premades', 'Item Compendium'), selection, false);
    if (!itemData) return;
    itemData.name = workflow.item.name + ': ' + itemData.name;
    itemData.flags['tidy5e-sheet'] = {
        'favorite': true
    }
    async function effectMacro () {
        await warpgate.revert(token.document, 'Dragon Vessel');
    }
    let effectData = {
        'label': workflow.item.name,
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
            'dae': {
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
                [itemData.name]: effectData
            }
        }
    };
    let optionsW = {
        'permanent': false,
        'name': 'Dragon Vessel',
        'description': itemData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, optionsW);
}