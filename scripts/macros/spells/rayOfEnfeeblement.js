import {queue} from '../../queue.js';
export async function rayOfEnfeeblement({speaker, actor, token, character, item, args}) {
    if (this.isFumble || this.item.type != 'weapon') return;
    if (this.item.system.properties?.fin) {
        let str = this.actor.system.abilities.str.value;
        let dex = this.actor.system.abilities.dex.value;
        if (str < dex) return;
    }
    let queueSetup = await queue.setup(this.item.uuid, 'rayOfEnfeeblement', 360);
    if (!queueSetup) return;
    let damageRollFormula = 'floor((' + this.damageRoll._formula + ')/2)';
    let damageRoll = await new Roll(damageRollFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}