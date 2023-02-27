export async function claws(workflow) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.advantage != true) return;
    if (workflow.advantage && workflow.disadvantage) return;
    let damageDice = 4;
    if (workflow.isCritical) damageDice = 8;
    let damageFormula = damageDice + 'd6[psychic] + 3';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}