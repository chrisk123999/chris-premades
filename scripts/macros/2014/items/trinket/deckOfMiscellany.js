import {compendiumUtils, constants, dialogUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function useCard({trigger, workflow}) {
    let itemData = workflow.item.flags['chris-premades']?.deckOfMiscellany?.itemData;
    genericUtils.setProperty(itemData, 'system.container', null);
    if (!itemData) return;
    await itemUtils.createItems(workflow.actor, [itemData]);
}
async function setup({trigger, workflow}) {
    let items = [
        {
            prependName: 'CHRISPREMADES.Macros.DeckOfMiscellany.Wooden',
            documentName: 'Abacus'
        },
        {
            documentName: 'Perfume (vial)',
            quantity: 4
        },
        {
            documentName: 'Rations (1 day)',
            quantity: 5
        },
        {
            documentName: 'Pot, Iron'
        },
        {
            documentName: 'Disguise Kit'
        },
        {
            documentName: 'Window',
            pack: constants.featurePacks.itemFeatures
        },
        {
            documentName: 'Manacles'
        },
        {
            documentName: 'Parchment (one sheet)',
            quantity: 10
        },
        {
            documentName: 'Dagger',
            quantity: 3
        },
        {
            documentName: 'Oil (flask)',
            quantity: 4
        },
        {
            prependName: 'CHRISPREMADES.Macros.DeckOfMiscellany.Silk',
            documentName: 'Robes'
        },
        {
            documentName: 'Forgery Kit'
        },
        {
            documentName: 'Quarterstaff'
        },
        {
            documentName: 'Fishing Tackle'
        },
        {
            prependName: 'CHRISPREMADES.Macros.DeckOfMiscellany.Leather',
            documentName: 'Pouch',
            appendName: 'CHRISPREMADES.Macros.DeckOfMiscellany.Gold',
            gold: 18
        },
        {
            documentName: 'Crossbow Bolts',
            quantity: 10
        },
        {
            documentName: 'Book'
        },
        {
            documentName: 'Tent, Two-Person'
        },
        {
            documentName: 'Rope, Silk (50 feet)'
        },
        {
            documentName: 'Crowbar',
            quantity: 2
        },
        {
            documentName: 'Healer\'s Kit'
        },
        {
            documentName: 'Gems',
            pack: constants.featurePacks.itemFeatures,
            value: 5,
            quantity: 8
        },
        {
            documentName: 'Lamp'
        },
        {
            documentName: 'Chain (10 feet)'
        },
        {
            documentName: 'Spear',
            quantity: 3
        },
        {
            documentName: 'Mirror, Steel'
        },
        {
            documentName: 'Pole (10-foot)'
        },
        {
            prependName: 'CHRISPREMADES.Macros.DeckOfMiscellany.Burlap',
            documentName: 'Sack'
        },
        {
            documentName: 'Light Hammer'
        },
        {
            documentName: 'Arrows',
            quantity: 10
        }
    ];
    let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
    let itemPack = game.packs.get(itemCompendium);
    if (!itemPack) return;
    let updates = [];
    let cardData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Miscellany Card', {object: true, translate: 'CHRISPREMADES.Macros.DeckOfMiscellany.Card'});
    if (!cardData) return;
    for (let i of items) {
        let itemData = genericUtils.duplicate(cardData);
        let pack = i.pack ? i.pack : itemCompendium;
        let documentData = await compendiumUtils.getItemFromCompendium(pack, i.documentName, {object: true});
        if (!documentData) continue;
        if (i.prependName) documentData.name = genericUtils.translate(i.prependName) + ' ' + documentData.name;
        if (i.appendName) documentData.name += ' ' + genericUtils.translate(i.appendName);
        itemData.name += ': ' + documentData.name;
        itemData.img = documentData.img;
        if (i.quantity) documentData.system.quantity = i.quantity;
        if (i.gold) documentData.system.currency.gp = i.gold;
        if (i.value) documentData.system.price.value = i.value;
        itemData.system.container = workflow.item.system.container;
        genericUtils.setProperty(itemData, 'system.source.rules', workflow.item.system.source.rules);
        genericUtils.setProperty(itemData, 'flags.chris-premades.deckOfMiscellany.itemData', documentData);
        updates.push(itemData);
    }
    if (updates.length) await itemUtils.createItems(workflow.actor, updates);
}
async function updated({trigger: {entity, item, updates}}) {
    if (!updates.system?.container) return;
    if (updates.system.container != entity.id) return;
    let identifier = genericUtils.getIdentifier(item);
    if (identifier === 'miscellanyCard') return;
    if (!itemUtils.getConfig(entity, 'allowCreation')) {
        await genericUtils.update(item, {'system.container': null});
        return;
    }
    let selection = await dialogUtils.confirm(entity.name, 'CHRISPREMADES.Macros.DeckOfMiscellany.Convert');
    if (!selection) {
        await genericUtils.update(item, {'system.container': null});
        return;
    }
    let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
    let itemPack = game.packs.get(itemCompendium);
    if (!itemPack) return;
    let cardData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Miscellany Card', {object: true});
    if (!cardData) return;
    let itemData = genericUtils.duplicate(item.toObject());
    cardData.name = genericUtils.translate('CHRISPREMADES.Macros.DeckOfMiscellany.Card') + ': ' + itemData.name;
    cardData.img = itemData.img;
    genericUtils.setProperty(cardData, 'system.source.rules', entity.system.source.rules);
    genericUtils.setProperty(cardData, 'flags.chris-premades.deckOfMiscellany.itemData', itemData);
    genericUtils.setProperty(cardData, 'system.container', entity.id);
    await itemUtils.createItems(item.actor, [cardData], {identifier: 'miscellanyCard'});
    await genericUtils.remove(item);
}
export let deckOfMiscellany = {
    name: 'Deck of Miscellany',
    version: '1.3.98',
    rules: 'legacy',
    item: [
        {
            pass: 'actorUpdated',
            macro: updated,
            priority: 50
        }
    ],
    config: [
        {
            value: 'allowCreation',
            label: 'CHRISPREMADES.Macros.DeckOfMiscellany.AllowCreation',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let deckOfMiscellanySetup = {
    name: 'Deck of Miscellany: Setup',
    version: deckOfMiscellany.version,
    rules: deckOfMiscellany.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: setup,
                priority: 50
            }
        ]
    }
};
export let miscellanyCard = {
    name: 'Miscellany Card',
    version: deckOfMiscellany.version,
    rules: deckOfMiscellany.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useCard,
                priority: 50
            }
        ]
    } 
};