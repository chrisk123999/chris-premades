import {queue} from '../../../../queue.js';
export async function destructiveWrath({speaker, actor, token, character, item, args}) {
    let queueSetup = await queue.setup(this.item.uuid, 'destructiveWrath', 351);
    if (!queueSetup) return;
    let oldDamageRoll = this.damageRoll;
    if (oldDamageRoll.terms.length === 0) {
        queue.remove(this.item.uuid);
        return;
    }
    let newDamageRoll = '';
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
        let flavor = oldDamageRoll.terms[i].flavor;
        let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
        if (!(flavor.toLowerCase() === 'lightning' || flavor.toLowerCase() === 'thunder') || isDeterministic === true) {
            newDamageRoll += oldDamageRoll.terms[i].formula;
        } else {
            newDamageRoll += '(' + oldDamageRoll.terms[i].number + '*' + oldDamageRoll.terms[i].faces + ')[' + flavor + ']';
        }
    }
    let damageRoll = await new Roll(newDamageRoll).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}