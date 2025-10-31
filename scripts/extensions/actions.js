import {compendiumUtils, constants, genericUtils, itemUtils} from '../utils.js';
async function createToken(token, options, userId) {
    if (userId != game.user.id) return;
    let actorType = token.actor?.type;
    if (!(actorType === 'character' || actorType === 'npc')) return;
    let mode = genericUtils.getCPRSetting('addActions');
    let link = token.actor.prototypeToken.actorLink;
    if (mode < 7) {
        let linkedModes = [1, 3, 4, 6];
        if (link && !linkedModes.includes(mode)) return;
        if (!link && linkedModes.slice(0, 3).includes(mode)) return;
        let characterModes = [1, 2, 3, 7, 8];
        if (actorType === 'character' && !characterModes.includes(mode)) return;
        if (actorType === 'npc' && characterModes.includes(mode)) return;
    } else if (mode === 7) {
        if (!link) return;
    } else if (mode === 8) {
        if (link) return;
    }
    let rules = game.settings.get('dnd5e', 'rulesVersion') === 'modern' ? '2024' : '2014';
    if (genericUtils.getCPRSetting('actionMode') === 1) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'genericActions');
        if (item) return;
        let packId = constants.packs.miscellaneous;
        if (!game.packs.get(packId)) return;
        let itemName = 'Generic Actions ' + '(' + rules + ')';
        let itemData = await compendiumUtils.getItemFromCompendium(packId, itemName, {object: true, translate: 'CHRISPREMADES.Macros.GenericActions.Name'});
        itemData.system.source.rules = rules;
        await itemUtils.createItems(token.actor, [itemData], {section: genericUtils.translate('CHRISPREMADES.Generic.Actions')});
    } else {
        let packId = rules === '2024' ? constants.modernPacks.actions : constants.packs.actions;
        let pack = game.packs.get(packId);
        if (!pack) return;
        await pack.getDocuments();
        let updates = await Promise.all(pack.contents.filter(i => !token.actor.items.getName(i.name)).map(async j => {
            let itemData = genericUtils.duplicate(j.toObject());
            delete itemData._id;
            itemData.system.description.value = itemUtils.getItemDescription(itemData.name);
            return itemData;
        }));
        if (!updates.length) return;
        await itemUtils.createItems(token.actor, updates, {section: genericUtils.translate('CHRISPREMADES.Generic.Actions')});
    }
    
}
export let actions = {
    createToken
};