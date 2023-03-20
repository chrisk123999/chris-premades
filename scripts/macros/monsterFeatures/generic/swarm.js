import {queue} from '../../../queue.js';
export async function swarmDamage({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let hp = this.actor.system.attributes.hp.value;
    let maxhp = this.actor.system.attributes.hp.value;
    if (hp < Math.floor(maxhp / 2)) return;
    let queueSetup = await queue.setup(this.item.uuid, 'swarmDamage', 50);
    if (!queueSetup) return;
    let damageFormula = this.damageRoll._formula;
    let diceNum = Number(damageFormula.substring(0,1)) / 2;
    let restOfFormula = damageFormula.substring(1);
    let newFormula = diceNum + restOfFormula;
    let damageRoll = await new Roll(newFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}