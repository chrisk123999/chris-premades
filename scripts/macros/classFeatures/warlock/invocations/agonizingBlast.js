import {queue} from '../../../../queue.js';
export async function agonizingBlast({speaker, actor, token, character, item, args}) {
    let spellName = this.actor.flags['chris-premades']?.feature?.agonizingBlast?.name;
    if (!spellName) spellName = 'Eldritch Blast';
    if (this.item.name != spellName) return;
    let queueSetup = await queue.setup(this.item.uuid, 'agonizingBlast', 250);
    if (!queueSetup) return;
    let bonusDamage = Math.max(this.actor.system.abilities.cha.mod, 0);
    let damageFormula = this.damageRoll._formula + ' + ' + bonusDamage + '[force]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}