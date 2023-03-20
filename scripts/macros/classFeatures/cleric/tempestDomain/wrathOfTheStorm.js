import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
export async function wrathOfTheStorm({speaker, actor, token, character, item, args}) {
    let queueSetup = await queue.setup(this.item.uuid, 'wrathOfTheStorm', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Lightning', '[lightning]'], ['Thunder', '[thunder]']]);
    if (!selection) selection = 'lightning';
    let damageFormula = this.damageRoll._formula + selection;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}