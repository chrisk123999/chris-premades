import {compendiumUtils, constants, dialogUtils, genericUtils, itemUtils, rollUtils} from '../../../../utils.js';
async function setup({trigger, workflow}) {
    let rollTablePackId = genericUtils.getCPRSetting('rollTableCompendium');
    let pack = game.packs.get(rollTablePackId);
    if (!pack) return;
    let table = await compendiumUtils.getItemFromCompendium(rollTablePackId, 'Robe of Useful Items: Patch');
    if (!table) return;
    let resultTable = [
        {min: 1, max: 8, result: 'gold'},
        {min: 9, max: 15, result: 'silverCoffer'},
        {min: 16, max: 22, result: 'ironDoor'},
        {min: 23, max: 30, result: 'gems'},
        {min: 31, max: 44, result: 'ladder'},
        {min: 45, max: 51, result: 'ridingHorse'},
        {min: 52, max: 59, result: 'pit'},
        {min: 60, max: 68, result: 'healingPotions'},
        {min: 69, max: 75, result: 'rowBoat'},
        {min: 76, max: 83, result: 'spellScroll'},
        {min: 84, max: 90, result: 'mastiffs'},
        {min: 91, max: 96, result: 'window'},
        {min: 97, max: 100, result: 'ram'}
    ];
    let patches = ['lantern', 'lantern', 'dagger', 'dagger', 'mirror', 'mirror', 'pole', 'pole', 'rope', 'rope', 'sack', 'sack'];
    for (let i = 0; i < workflow.utilityRolls[0].total; i++) {
        let draw = await table.draw();
        patches.push(resultTable.find(({min, max}) => draw.roll.total >= min && draw.roll.total <= max).result);
    }
    let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
    let itemPack = game.packs.get(itemCompendium);
    if (!itemPack) return;
    for (let i of patches) {
        let itemData;
        switch(i) {
            case 'lantern': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Lantern, Bullseye', {object: true}); break;
            case 'dagger': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Dagger', {object: true}); break;
            case 'mirror': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Mirror, Steel', {object: true}); break;
            case 'pole': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Pole (10-foot)', {object: true}); break;
            case 'rope': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Rope, Hempen (50 feet)', {object: true}); break;
            case 'sack': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Sack', {object: true}); break;
            case 'gold':
                itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Sack', {object: true});
                if (!itemData) break;
                itemData.name = genericUtils.translate('CHRISPREMADES.Macros.RobeOfUsefulItems.Bag');
                itemData.system.currency.gp = 100;
                break;
            case 'silverCoffer': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Silver Coffer', {object: true}); break;
            case 'ironDoor': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Iron Door', {object: true}); break;
            case 'gems': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Gems', {object: true}); break;
            case 'ladder': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Wooden Ladder', {object: true}); break;
            case 'ridingHorse': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Riding Horse', {object: true}); break;
            case 'pit': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Open Pit', {object: true}); break;
            case 'healingPotions': 
                itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Potion of Healing', {object: true});
                itemData.system.quantity = 4;
                break;
            case 'rowBoat': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Rowboat', {object: true}); break;
            case 'spellScroll': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Spell Scroll', {object: true}); break;
            case 'mastiffs': 
                itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Mastiff', {object: true});
                itemData.system.quantity = 2;
                break;
            case 'window': itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Window', {object: true}); break;
            case 'ram': itemData = await compendiumUtils.getItemFromCompendium(itemCompendium, 'Ram, Portable', {object: true}); break;
        }
        if (!itemData) continue;
        let name = genericUtils.translate('CHRISPREMADES.Macros.RobeOfUsefulItems.Patch') + ' ' + itemData.name;
        let item = workflow.actor.items.find(j => j.name === name && j.system.container === workflow.item.system.container);
        if (item) {
            await genericUtils.update(item, {['system.quantity']: item.system.quantity + 1});
        } else {
            let patchData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Patch', {object: true});
            patchData.name = name;
            patchData.img = itemData.img;
            genericUtils.setProperty(patchData, 'system.source.rules', workflow.item.system.source.rules);
            genericUtils.setProperty(patchData, 'flags.chris-premades.robeOfUsefulItems.itemData', itemData);
            genericUtils.setProperty(patchData, 'system.container', workflow.item.system.container);
            await itemUtils.createItems(workflow.actor, [patchData], {identifier: 'robeOfUsefulItemsPatch'});
        }
    }
}
async function unpatch({trigger, workflow}) {
    let itemData = workflow.item.flags['chris-premades']?.robeOfUsefulItems?.itemData;
    genericUtils.setProperty(itemData, 'system.container', null);
    if (!itemData) return;
    await itemUtils.createItems(workflow.actor, [itemData]);
}
async function updated({trigger: {entity, item, updates}}) {
    if (!itemUtils.getConfig(entity, 'allowPatching')) {
        await genericUtils.update(item, {'system.container': null});
        return;
    }
    if (!updates.system?.container) return;
    if (updates.system.container != entity.id) return;
    let identifier = genericUtils.getIdentifier(item);
    if (identifier === 'robeOfUsefulItemsPatch') return;
    let selection = await dialogUtils.confirm(entity.name, 'CHRISPREMADES.Macros.RobeOfUsefulItems.Convert');
    if (!selection) {
        await genericUtils.update(item, {'system.container': null});
        return;
    }
    let itemCompendium = genericUtils.getCPRSetting('itemCompendium');
    let itemPack = game.packs.get(itemCompendium);
    if (!itemPack) return;
    let patchData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Patch', {object: true});
    if (!patchData) return;
    let itemData = genericUtils.duplicate(item.toObject());
    patchData.name = genericUtils.translate('CHRISPREMADES.Macros.RobeOfUsefulItems.Patch') + ' ' + itemData.name;
    patchData.img = itemData.img;
    genericUtils.setProperty(patchData, 'system.source.rules', entity.system.source.rules);
    genericUtils.setProperty(patchData, 'flags.chris-premades.robeOfUsefulItems.itemData', itemData);
    genericUtils.setProperty(patchData, 'system.container', entity.id);
    await itemUtils.createItems(item.actor, [patchData], {identifier: 'robeOfUsefulItemsPatch'});
    await genericUtils.remove(item);
}
export let robeOfUsefulItems = {
    name: 'Robe of Useful Items',
    version: '1.3.88',
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
            value: 'allowPatching',
            label: 'CHRISPREMADES.Macros.RobeOfUsefulItems.AllowPatching',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let robeOfUsefulItemsSetupPatch = {
    name: 'Robe of Useful Items: Setup',
    version: robeOfUsefulItems.version,
    rules: robeOfUsefulItems.rules,
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
export let robeOfUsefulItemsPatch = {
    name: 'Robe of Useful Items: Patch',
    version: robeOfUsefulItems.version,
    rules: robeOfUsefulItems.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: unpatch,
                priority: 50
            }
        ]
    }
};