import {chris} from '../helperFunctions.js';
export async function itemDC(effect, updates, options, user) {
    if (!updates.changes || !effect.parent || !effect.origin) return;
    if (updates.changes.length === 0) return;
    if (effect.parent.constructor.name != 'Actor5e') return;
    let origin = fromUuidSync(effect.origin);
    if (!origin) return;
    if (origin.constructor.name != 'Item5e') return;
    let changed = false;
    for (let i of updates.changes) {
        if (typeof i.value !== 'string') continue;
        if (!i.value.includes('$chris.itemDC')) continue;
        let itemDC = chris.getSpellDC(origin);
        i.value = i.value.replace('$chris.itemDC', itemDC);
        changed = true;
    }
    if (!changed) return;
    effect.updateSource({'changes': updates.changes});
}
export async function fixOrigin(token, options, user) {
    if ((game.user.id !== user) || token.actorLink) return;
    let updates = await token.actor.effects.reduce(async (updates, effect) => {
        if (!effect.origin) return updates;
        let origin = await fromUuid(effect.origin);
        if (!origin instanceof Item) return updates;
        let item = token.actor.items.get(origin.id);
        if (item) updates.push({'_id': effect.id, 'origin': item.uuid});
        return updates;
    }, []);
    if (Object.keys(updates).length === 0) return;
    await token.actor.updateEmbeddedDocuments('ActiveEffect', updates);
}