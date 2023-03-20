import {queue} from '../../../queue.js';
export async function enlarge({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1 || this.item.type != 'weapon') return;
    if (this.item.system.properties?.fin) {
        let str = this.actor.system.abilities.str.value;
        let dex = this.actor.system.abilities.dex.value;
        if (str < dex) return;
    }
    let queueSetup = await queue.setup(this.item.uuid, 'enlarge', 50);
    if (!queueSetup) return;
    let diceNum = this.damageRoll.terms[0].number * 2;
    let damageFormula = diceNum + this.damageRoll._formula.substring(1);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}