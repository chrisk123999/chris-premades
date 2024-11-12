import {constants, genericUtils, itemUtils} from '../utils.js';
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
    let pack = game.packs.get(constants.packs.actions);
    if (!pack) return;
    await pack.getDocuments();
    let updates = await Promise.all(pack.contents.filter(i => !token.actor.items.getName(i.name)).map(async j => {
        let itemData = genericUtils.duplicate(j.toObject());
        delete itemData._id;
        itemData.system.description.value = itemUtils.getItemDescription(itemData.name);
        return itemData;
    }));
    if (!updates.length) return;
    await itemUtils.createItems(token.actor, updates, {section: 'CHRISPREMADES.Generic.Actions'});
}
export let actions = {
    createToken
};