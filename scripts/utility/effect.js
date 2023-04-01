import {chris} from '../helperFunctions.js';
export async function preCreateActiveEffect(effect, updates, options, id) {
    if (!updates.changes || !effect.parent || !effect.origin) return;
    if (updates.changes.length === 0) return;
    if (effect.parent.constructor.name != 'Actor5e') return;
    if (!effect.origin) return;
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