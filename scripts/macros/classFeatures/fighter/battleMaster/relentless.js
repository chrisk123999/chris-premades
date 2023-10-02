import {chris} from '../../../../helperFunctions.js'
export async function relentless(actor) {
    let feature = chris.getItem(actor, 'Superiority Dice');
    if (!feature) return;
    if (!feature.system.uses.value) await feature.update({'system.uses.value': 1})
}