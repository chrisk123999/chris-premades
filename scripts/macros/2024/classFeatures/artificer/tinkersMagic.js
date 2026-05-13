import {CompendiumBrowser} from '../../../../applications/compendiumBrowser.js';
import {constants, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
let itemIDs = [
    'ball-bearings', 'basket', 'bedroll', 'bell', 'blanket', 'block-and-tackle', 'bottle-glass', 'bucket',
    'caltrops', 'candle', 
    'flask', 
    'grappling-hook', 
    'hunting-trap', 
    'jug', 
    'lamp', 
    'manacles', 
    'net', 
    'oil', 
    'paper', 'parchment', 'pouch', 
    'rope', 
    'sack', 'shovel', 'spikes-iron', 'iron-spike', 'string', 
    'tinderbox', 'torch', 
    'vial'
];
async function use({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;    
    if (itemUtils.getConfig(item, 'requireTools') && !workflow.actor.items.some(i => i.system.type?.baseItem === 'tinker')) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.TinkersMagic.NeedTools', {itemName: item.name}), 'warn');
        return;
    }
    let types = itemUtils.getConfig(workflow.item, 'itemTypes') || [];
    let filters = [
        ['properties', ['mgc'], {locked: true, exclude: true}],
        ['rarity', Object.keys(CONFIG.DND5E.itemRarity), {locked: true, exclude: true}],
        ['rarity', ['_blank'], {locked: true}],
        ['documentTypes', types, {locked: true}]
    ];
    let compendium = itemUtils.getConfig(workflow.item, 'compendium');
    if (compendium) filters.push(['compendium', [compendium], {locked: true}]);
    else filters.push(['systemIdentifier', itemIDs, {locked: true}]);
    let choices = await CompendiumBrowser.select(CompendiumBrowser.tabs.items, filters, {
        hint: genericUtils.format('CHRISPREMADES.Macros.TinkersMagic.Prompt', {itemName: item.name}),
        maxAmount: item.system.uses.value,
        minAmount: 1
    });
    if (!choices?.length) return;
    let existingEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'tinkersMagic');
    existingEffect ??= await effectUtils.createEffect(workflow.actor, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        flags: {
            dae: {
                specialDuration: ['longRest']
            }
        }
    }, {identifier: 'tinkersMagic', rules: tinkersMagic.rules});
    await itemUtils.createItems(workflow.actor, choices, {parentEntity: existingEffect, identifier: 'tinkersMagicItem'});
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + choices.length});
}
export let tinkersMagic = {
    name: 'Tinker\'s Magic',
    version: '1.5.17',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 20
            }
        ]
    },
    config: [
        {
            value: 'requireTools',
            label: 'CHRISPREMADES.Macros.TinkersMagic.RequireTools',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'compendium',
            label: 'CHRISPREMADES.Macros.TinkersMagic.CustomCompendium',
            type: 'select',
            options: constants.itemCompendiumPacks,
            default: '',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'itemTypes',
            label: 'CHRISPREMADES.Config.ItemTypes',
            type: 'select-many',
            default: ['container', 'consumable', 'loot'],
            options: constants.itemOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
