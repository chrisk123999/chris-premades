import {compendiumUtils, documentUtils, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../proxy.mjs';
const tiers = [
    ['potion-of-healing', 'potion-of-climbing', 'Ale', 'OliveOil'],
    ['potion-of-greater-healing', 'potion-of-fire-breath', 'Mead'],
    ['potion-of-superior-healing', 'potion-of-flying', 'Wine'],
    ['potion-of-supreme-healing', 'potion-of-dragons-majesty', 'Whiskey']
];
const tierIndex = {'dragon-vessel-slumbering': 0, 'dragon-vessel-stirring': 1, 'dragon-vessel-wakened': 2, 'dragon-vessel-ascendant': 3};
async function findPotion(identifier) {
    const packIds = [...compendiumUtils.getEnabledCompendiumIds('itemCompendiums'), 'chris-premades.CPREquipment2014', 'dnd5e.items'];
    for (const packId of packIds) {
        if (!game.packs.get(packId)) continue;
        const itemData = await compendiumUtils.getDocumentByIdentifier(packId, identifier, {object: true});
        if (itemData) return itemData;
    }
}
async function fill({document: item, workflow}) {
    const tier = tierIndex[documentUtils.getIdentifier(item)] ?? 0;
    const options = tiers.slice(0, tier + 1).reverse().flat();
    const buttons = options.map(option => [_loc('CHRISPREMADES.Macros.Legacy.DragonVessel.' + (option.startsWith('potion-') ? option.split('-').map(word => word.capitalize()).join('') : option)), option]);
    const selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Legacy.DragonVessel.Select', buttons);
    if (!selection || !selection.startsWith('potion-')) return;
    const itemData = await findPotion(selection);
    if (!itemData) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.DragonVessel.Missing', {type: 'warn'});
    itemData.name = item.name + ': ' + itemData.name;
    const [effect] = await effectUtils.createEffects(workflow.actor, [{name: item.name, img: item.img, origin: item.uuid, duration: {value: 86400, units: 'seconds'}}]);
    if (effect) await itemUtils.createItems(workflow.actor, [itemData], {favorite: true, parentEntity: effect});
}
export const dragonVessel = {
    name: 'Dragon Vessel',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: fill,
            priority: 50
        }
    ]
};
