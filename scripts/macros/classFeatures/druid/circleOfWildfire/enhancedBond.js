import {chris} from '../../../../helperFunctions.js';
export function enhancedBond(actor) {
    let effect = chris.findEffect(actor, 'Summon Wildfire Spirit');
    if (!effect) return false;
    return true;
}