import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function potionOfMaximumPower({speaker, actor, token, character, item, args}) {
    if (this.targets.size === 0) return;
    if (this.item.type != 'spell') return;
    if (this.castData.castLevel > 4) return;
    let queueSetup = await queue.setup(this.item.uuid, 'potionOfMaximumPower', 480);
    if (!queueSetup) return;
    let oldDamageRoll = this.damageRoll;
    let newDamageRoll = '';
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
            let flavor = oldDamageRoll.terms[i].flavor;
            let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
            if (isDeterministic === true) {
                newDamageRoll += oldDamageRoll.terms[i].formula;
            } else {
                newDamageRoll += '(' + oldDamageRoll.terms[i].number + '*' + oldDamageRoll.terms[i].faces + ')[' + flavor + ']';
            }
    }
    let roll = await new Roll(newDamageRoll).roll({async: true});
    await this.setDamageRoll(roll);
    let effect = chris.findEffect(this.actor, 'Potion of Maximum Power');
    if (effect) await chris.removeEffect(effect);
    queue.remove(this.item.uuid);
}