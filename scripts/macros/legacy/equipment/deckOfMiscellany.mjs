import cprConstants from '../../../constants.mjs';
import {compendiumUtils, documentUtils, genericUtils, itemUtils} from '../../../proxy.mjs';
import {findItem} from '../../all/equipment/robeOfUsefulItems.mjs';
const cards = [
    ['abacus', {prefix: 'Wooden'}], ['perfume', {quantity: 4}], ['rations', {quantity: 5}], ['iron-pot'], ['disguise-kit'], ['window'], ['manacles'],
    ['parchment', {quantity: 10}], ['dagger', {quantity: 3}], ['oil-flask', {quantity: 4}], ['robes', {prefix: 'Silk'}], ['forgery-kit'], ['quarterstaff'],
    ['fishing-tackle'], ['pouch', {prefix: 'Leather', gold: 18}], ['crossbow-bolt', {quantity: 10}], ['book'], ['two-person-tent'], ['silk-rope-50-ft'],
    ['crowbar', {quantity: 2}], ['healers-kit'], ['gems', {quantity: 8, price: 5}], ['lamp'], ['chain-10-feet'], ['spear', {quantity: 3}], ['steel-mirror'],
    ['pole'], ['sack', {prefix: 'Burlap'}], ['light-hammer'], ['arrow', {quantity: 10}]
];
async function setup({document: item, workflow}) {
    const template = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'miscellany-card', {object: true});
    if (!template) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.DeckOfMiscellany.NoCard', {type: 'warn'});
    const deck = workflow.actor.items.find(other => other.type === 'container' && documentUtils.getIdentifier(other) === 'deck-of-miscellany');
    const created = [];
    for (const [identifier, {prefix, quantity, gold, price} = {}] of cards) {
        const uuid = await findItem(identifier, '2014');
        const source = uuid && await fromUuid(uuid);
        if (!source) continue;
        const name = (prefix ? _loc('CHRISPREMADES.Macros.Legacy.DeckOfMiscellany.' + prefix) + ' ' : '') + source.name;
        const updates = {name};
        if (gold) genericUtils.setProperty(updates, 'system.currency.gp', gold);
        if (price) genericUtils.setProperty(updates, 'system.price.value', price);
        const card = genericUtils.duplicate(template);
        delete card._id;
        card.name = template.name + ': ' + name;
        card.img = source.img;
        if (deck) card.system.container = deck.id;
        genericUtils.setProperty(card, 'flags.cat.storedItem', {uuid, quantity, updates});
        created.push(card);
    }
    await itemUtils.createItems(workflow.actor, created);
}
export const deckOfMiscellanySetup = {
    name: 'Deck of Miscellany: Setup',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: setup,
            priority: 50
        }
    ]
};
