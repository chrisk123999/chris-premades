import {chris} from '../../../helperFunctions.js';
export async function dangerSense(saveId, options) {
    if (saveId != 'dex' || options.advantage) return;
    let blinded = chris.findEffect(this, 'Blinded');
    let deafened = chris.findEffect(this, 'Deafened');
    let incapacitated = chris.findEffect(this, 'Incapacitated');
    if (blinded || deafened || incapacitated) return;
    let selection = await chris.dialog('Danger Sense', [['Yes', true], ['No', false]], 'Is this from an effect you can see?');
    if (selection) options.advantage = true;
}