import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function savageAttacks({speaker, actor, token, character, item, args}) {
    if (!this.isCritical || this.item.system.actionType != 'mwak' || !this.damageRoll) return;
    let queueSetup = await queue.setup(this.item.uuid, 'savageAttacks', 250);
    if (!queueSetup) return;
    let dice = this.damageRoll.terms[0].faces;
    if (!dice) {
        queue.remove(this.item.uuid);
        return;
    }
    let damageFormula = this.damageRoll._formula + ' + 1d' + dice + '[' + this.defaultDamageType + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    let effect = chris.findEffect(this.actor, 'Savage Attacks');
    if (effect) {
        let originItem = await fromUuid(effect.origin);
        if (originItem) await originItem.use();
    }
    queue.remove(this.item.uuid);
}