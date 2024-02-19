import {chris} from '../../../helperFunctions.js';
export async function claws({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.advantage != true) return;
    if (workflow.advantage && workflow.disadvantage) return;
    let damageDice = 4;
    let damageFormula = damageDice + 'd6[psychic] + 3';
    let damageRoll = await chris.damageRoll(workflow, damageFormula);
    await workflow.setDamageRoll(damageRoll);
}