import {chris} from '../../../helperFunctions.js';
export async function claws({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.advantage != true) return;
    if (workflow.advantage && workflow.disadvantage) return;
    let damageDice = 4;
    let damageFormula = damageDice + 'd6[psychic] + 3';
    if (workflow.isCritical) damageFormula = chris.getCriticalFormula(damageFormula);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}