import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function dangerSense(saveId, options) {
    if (saveId != 'dex' || options.advantage) return;
    let blinded = chris.findEffect(this, 'Blinded');
    let deafened = chris.findEffect(this, 'Deafened');
    let incapacitated = chris.findEffect(this, 'Incapacitated');
    if (blinded || deafened || incapacitated) return;
    let queueSetup = queue.setup(saveId, 'dangerSense', 50);
    if (!queueSetup) return false;
    let selection = await chris.dialog('Danger Sense', [['Yes', true], ['No', false]], 'Is this from an effect you can see?') ?? false;
    if (selection) options.advantage = true;
    queue.remove(saveId);
}