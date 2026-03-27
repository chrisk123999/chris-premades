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
    let types = new Set(itemUtils.getConfig(workflow.item, 'itemTypes') || []);
    let arbitrary = itemUtils.getConfig(workflow.item, 'limitList') ? [{
        k: 'system.identifier', 
        v: new Set(itemIDs), 
        o: 'in'
    }] : [];
    let choices = await dnd5e.applications.CompendiumBrowser.select({
        selection: {
            min: 1,
            max: item.system.uses.value
        },
        filters: {
            locked: {
                exclusive: true,
                arbitrary,
                additional: { 
                    properties: { mgc: -1 },
                    rarity: { 
                        _blank: 1, 
                        ...Object.keys(CONFIG.DND5E.itemRarity).reduce((obj, key) => (obj[key] = -1, obj), {})
                    }
                }, 
                documentClass: Item.implementation.documentName,
                types
            }
        }, 
        hint: genericUtils.format('CHRISPREMADES.Macros.TinkersMagic.Prompt', {itemName: item.name}),
        tab: 'items'
    });
    if (!choices?.size) return;
    let items = await Promise.allSettled(choices.map(p => fromUuid(p)));
    items = items.map(r => r?.value).filter(i => !!i);
    if (!items?.length) return;
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
    await itemUtils.createItems(workflow.actor, items, {parentEntity: existingEffect, identifier: 'tinkersMagicItem'});
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + items.length});
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
            value: 'limitList',
            label: 'CHRISPREMADES.Macros.TinkersMagic.LimitList',
            type: 'checkbox',
            default: true,
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
