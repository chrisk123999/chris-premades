import {chris} from '../../../helperFunctions.js';
export async function claws({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    if (this.advantage != true) return;
    if (this.advantage && this.disadvantage) return;
    let damageDice = 4;
    let damageFormula = damageDice + 'd6[psychic] + 3';
    if (this.isCritical) damageFormula = chris.getCriticalFormula(damageFormula);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
}