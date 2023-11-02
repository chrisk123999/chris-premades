import {chris} from '../../../helperFunctions.js';
export function dangerSense(saveId, options) {
    let blinded = chris.findEffect(this, 'Blinded');
    let deafened = chris.findEffect(this, 'Deafened');
    let incapacitated = chris.findEffect(this, 'Incapacitated');
    if (blinded || deafened || incapacitated) return;
    return saveId != 'dex' ? false : {'label': 'This save from an effect you can see.', 'type': 'advantage'};
}