import {chris} from '../../../../helperFunctions.js';
export async function legionOfOne(actor) {
    let item = chris.getItem(actor, 'Unleash Incarnation');
    if (!item?.system?.uses?.value) return;
    await item.update({'system.uses.value': 1});
}