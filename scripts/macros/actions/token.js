import {chris} from '../../helperFunctions.js';
export async function addActions(token, options, userId) {
    let option = game.settings.get('chris-premades', 'Add Generic Actions');
    if (option === 'none' || userId != game.user.id || !token.actor) return;
    switch (option) {
        case 'uCharacter':
            if (token.actor.prototypeToken.actorLink) return;
        case 'character':
            if (token.actor.type != 'character') return;
            break;
        case 'uNpc':
            if (token.actor.prototypeToken.actorLink) return;
        case 'npc':
            if (token.actor.type != 'npc') return;
            break;
        case 'lNpc':
            if (!token.actor.prototypeToken.actorLink || token.actor.type != 'npc') return;
            break;
        case 'lCharacter':
            if (!token.actor.prototypeToken.actorLink || token.actor.type != 'character') return;
            break;
        default:
            if (token.actor.type != 'character' && token.actor.type != 'npc') return;
            break;
    }
    let pack = game.packs.get('chris-premades.CPR Actions');
    if (!pack) return;
    await pack.getDocuments();
    let newItemData = [];
    for (let i of pack.contents) {
        if (token.actor.items.getName(i.name)) continue;
        let itemData = i.toObject();
        delete itemData._id;
        itemData.system.description.value = chris.getItemDescription('CPR - Descriptions', itemData.name);
        newItemData.push(itemData);
    }
    if (newItemData.length) await token.actor.createEmbeddedDocuments('Item', newItemData);
}